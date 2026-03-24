# Architecture du Service Pyodide

Ce document décrit l'architecture et le flux de travail du service Pyodide dans CodeClique.

## Aperçu de l'Architecture

```mermaid
graph LR
    subgraph "Isolé (Web Worker)"
        Worker["<b>Worker Python</b><br/>Runtime Pyodide (WASM)<br/>Interpréteur & Matplotlib"]
    end

    subgraph "Navigateur (Main Thread)"
        Service["<b>Service Pyodide</b><br/>Gestionnaire d'exécutions<br/>(Handlers & Callbacks)"]
    end

    %% Interactions Inversées
    Worker -- "Sorties (stdout/stderr)" --> Service
    Worker -- "Flux Images (Base64)" --> Service
    Service -- "Code à exécuter" --> Worker
    Service -. "Signal d'arrêt (SAB)" .-> Worker
```

Pyodide est en fait composé de deux éléments principaux:
- le service `pyodide.ts` dont une instance peut être créé dans un composant et passée aux enfants 
- le worker `pyodide.ts` lié à une instance du service et pouvant être redémarré 

### 1. Service Pyodide (`pyodide.ts`) dans le Thread Principal
- **Mappage d'Exécution** : Utilise une `Map<string, ExecutionHandler>` pour suivre les requêtes multiples, qu'elles soient simultanées ou successives. La clé correspond à une éxécution (un bloc de code) et un handler composé de:
```typescript
interface ExecutionHandler {
  onOutput?: (text: string) => void;
  onError?: (text: string) => void;
  isRunning?: WritableSignal<boolean>;
  onPlot?: (base64: string) => void;
}
``` 
- **SharedArrayBuffer** : Utilisé pour les interruptions à rapide. Si le navigateur ne le prend pas en charge (par exemple, en l'absence d'en-têtes d'isolation multi-origine), les interruptions sont désactivées et le Worker est relancé à la place (destructif).
- **Gestion du Worker** : Gère la terminaison et la réinitialisation si le noyau Python plante ou s'il est réinitialisé manuellement.

### 2. Pyodide Worker (`pyodide.worker.ts`) dans un Thread dédié
- **Isolation de l'Environnement** : Garantit que le chargement de Pyodide et les calculs Python intensifs ne figent pas l'interface utilisateur.
- **Assistant Matplotlib** : Injecte un script Python personnalisé (`_fetch_last_plot`) pour capturer les graphiques de `matplotlib.pyplot` et les renvoyer sous forme d'images au frontend.
- **Redirection de Flux** : Redirige les sorties `stdout` et `stderr` de Python vers le système `postMessage` du worker.


## Schéma de fonctionnement

```mermaid
sequenceDiagram
    participant UI as App Component
    participant SVC as Pyodide Service
    participant WK as Web Worker
    participant PY as Pyodide Engine (WASM)

    Note over UI, PY: Initialization Phase
    UI->>SVC: init(['numpy', 'matplotlib'])
    SVC->>WK: Spawn Worker & Create SharedArrayBuffer
    SVC->>WK: postMessage({ type: 'INIT', packages: [...] })
    WK->>PY: Load pyodide.mjs & packages
    PY-->>WK: Native Engine Loaded
    WK->>PY: Configure Matplotlib (Agg backend)
    WK->>SVC: postMessage({ type: 'READY' })
    SVC-->>UI: isReady.set(true)

    Note over UI, PY: Execution Phase
    UI->>SVC: run(code, handlers)
    SVC->>SVC: Generate executionId (UUID)
    SVC->>WK: postMessage({ type: 'RUN', id, code })
    
    WK->>PY: Attach stdout/stderr streams (register callbacks)
    WK->>PY: runPythonAsync(code)
    
    loop Stream Output
        PY->>WK: print() / sys.stderr
        WK->>SVC: postMessage({ type: 'RUN_STDOUT/ERR', id, text })
        SVC->>UI: Trigger onOutput / onError
    end

    PY-->>WK: Async Execution Finished
    
    Note over WK, PY: Data Extraction
    WK->>PY: Execute _fetch_last_plot()
    PY-->>WK: PNG Base64 Data
    WK->>SVC: postMessage({ type: 'RUN_PLOT_OUTPUT', id, base64 })
    SVC->>UI: Trigger onPlot(base64)

    WK->>SVC: postMessage({ type: 'RUN_SUCCESS', id })
    SVC->>UI: Update isRunning signal = false

    Note over UI, PY: Interrupt / Reset
    UI->>SVC: interruptExecution(id)
    SVC->>WK: interruptBuffer[0] = 2 (Atomic)
    Note right of PY: Engine checks buffer periodically
    
    opt If unresponsive
        SVC->>WK: terminate()
        SVC->>WK: Respawn new Worker
    end
```