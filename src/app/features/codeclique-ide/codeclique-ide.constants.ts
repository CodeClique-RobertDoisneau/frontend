import { PythonExample } from './codeclique-ide.types';

export const EXAMPLES: PythonExample[] = [
  {
    name: 'Bonjour le Monde',
    filename: 'bonjour.py',
    dependencies: [],
    code: `# Ton premier programme !
print("Bonjour tout le monde !")

nom = input("Comment t'appelles-tu ? ")
print(f"Ravi de te rencontrer, {nom} !")
`
  },
  {
    name: 'Calculatrice de Collège',
    filename: 'calculs.py',
    dependencies: [],
    code: `# Utilisation des variables et des opérations
a = 15
b = 4

print(f"Somme : {a} + {b} = {a + b}")
print(f"Différence : {a} - {b} = {a - b}")
print(f"Produit : {a} * {b} = {a * b}")
print(f"Division : {a} / {b} = {a / b}")
print(f"Reste de la division (modulo) : {a} % {b} = {a % b}")
`
  },
  {
    name: 'Boucles et Listes',
    filename: 'boucles.py',
    dependencies: [],
    code: `# Apprendre à répéter des actions
fruits = ["pomme", "banane", "cerise", "kiwi"]

print("Ma liste de fruits :")
for fruit in fruits:
    print(f"- J'aime manger des {fruit}s")

print("\\nCompter de 1 à 10 :")
for i in range(1, 11):
    print(i, end=" ")
`
  },
  {
    name: 'Simulation de Dés',
    filename: 'des.py',
    dependencies: [],
    code: `# Introduction à l'aléatoire (Probabilités)
import random

def lancer_de():
    return random.randint(1, 6)

print("Lancement de deux dés...")
de1 = lancer_de()
de2 = lancer_de()

somme = de1 + de2
print(f"Dé 1 : {de1}")
print(f"Dé 2 : {de2}")
print(f"Total : {somme}")

if somme == 7 or somme == 11:
    print("Gagné !")
else:
    print("Réessaye !")
`
  },
  {
    name: 'Graphique de Fonction',
    filename: 'graphique.py',
    dependencies: ['numpy', 'matplotlib'],
    code: `# Tracer une fonction mathématique
import matplotlib.pyplot as plt
import numpy as np

# On crée des points entre -10 et 10
x = np.linspace(-10, 10, 100)
# On calcule y = x² (une parabole)
y = x**2

plt.plot(x, y)
plt.title("Ma première parabole : y = x²")
plt.xlabel("Axe X")
plt.ylabel("Axe Y")
plt.grid(True)
plt.show()
`
  },
  {
    name: 'Suite de Fibonacci',
    filename: 'fibonacci.py',
    dependencies: [],
    code: `# Un classique des mathématiques
def fibonacci(n):
    a, b = 0, 1
    resultat = []
    while a < n:
        resultat.append(a)
        a, b = b, a + b
    return resultat

nombre_max = 100
print(f"Suite de Fibonacci jusqu'à {nombre_max} :")
print(fibonacci(nombre_max))
`
  }
];
