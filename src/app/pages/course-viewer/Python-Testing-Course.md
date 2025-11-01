# 🐍 Mini-cours Python (Test de rendu)

Ce court document Markdown est conçu pour tester le **rendu du code Python**, des **formules mathématiques**, des **images** et des **cas particuliers**.

## I / Bases

```python
print("Hello world!")  # Commentaire simple
```

Code en ligne : `a = b + c ** 2`

## II / Variables et mathématiques

Python attribue les types de variables dynamiquement :

```python
x, y = 5, 3
aire = x * y
print(aire)
```

Formule mathématique :

$$ E = mc^2, \quad \text{et} \quad \int_0^{2\pi} \sin(x),dx = 0 $$

## III / Listes et boucles

```python
objets = ["fusée", "capteur", "moteur"]
for i, objet in enumerate(objets, 1):
    print(f"{i}. {objet}")
```

> Bloc de citation : *« Python est simple, mais puissant. »* — Guido van Rossum

## IV / Images et liens

Image en ligne :

![Logo Python](https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg)

Exemple de lien : [Documentation officielle de Python](https://docs.python.org/3/)

## V / Tableau

| Nom   | Type                       | Exemple   |
| ----- | -------------------------- | --------- |
| int   | Entier                     | `42`      |
| float | Nombre à virgule flottante | `3.14`    |
| str   | Chaîne de caractères       | `"fusée"` |

## VI / Fonctions et exceptions

```python
def diviser(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return float('inf')

print(diviser(5, 0))
```

## VII / Autres langages

```java
public class Main {
  public static void main(String[] args) {
    System.out.println("Hello world!");
  }
}
```

```bash
echo "Hello world!"
```

## VIII / Émojis et mise en forme mixte

**Gras**, *italique*, ~~barré~~ et `code en ligne`

Math en ligne : $ f(x) = x^2 + 1 $

## IX / Rendu HTML

<button>Bouton activé</button>
<button disabled>Bouton désactivé</button>

<div style="border:3px solid #356774ff; border-radius: 10px; padding: 1em; background: #a1c6ceff;">
  <p>
    <strong>Carte d'information</strong>
  </p>
  <p>Ce bloc illustre un exemple de contenu HTML intégré dans du Markdown.</p>
</div>

