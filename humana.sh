#!/usr/bin/env bash
# Lance l'application Humana Essentiel en local et l'ouvre dans le navigateur.
# Double-cliquable via Humana.desktop, ou exécutable directement :
#   ./humana.sh
set -uo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Port différent de la démo (humana/, port 4173) pour permettre aux deux
# applications de tourner en même temps sur la même machine.
PORT=4174
URL="http://localhost:${PORT}"

echo "Humana Essentiel — démarrage"
echo "Dossier : $DIR"
echo

# Installe les dépendances si nécessaire (première utilisation).
if [ ! -d node_modules ]; then
    echo "Installation des dépendances (première utilisation, ~1 minute)…"
    npm install --no-fund --no-audit
    echo
fi

# Reconstruit uniquement si le build est absent ou périmé.
NEEDS_BUILD=0
if [ ! -f dist/index.html ]; then
    NEEDS_BUILD=1
elif [ -n "$(find src public index.html package.json -newer dist/index.html -type f 2>/dev/null | head -1)" ]; then
    NEEDS_BUILD=1
fi
if [ "$NEEDS_BUILD" = "1" ]; then
    echo "Construction de l'application…"
    npm run build
    echo
fi

# Libère le port si une instance précédente tourne encore.
if command -v fuser >/dev/null 2>&1; then
    fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
    sleep 0.3
fi

echo "Lancement du serveur local sur ${URL} …"
npx --yes serve -p "$PORT" -s dist >/tmp/humana-essentiel-serve.log 2>&1 &
SERVER_PID=$!

# Attend que le serveur réponde (jusqu'à ~15 s).
READY=0
for _ in $(seq 1 50); do
    if curl -s -o /dev/null "$URL"; then
        READY=1
        break
    fi
    sleep 0.3
done

if [ "$READY" = "1" ]; then
    echo "Application prête : $URL"
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$URL" >/dev/null 2>&1 &
    elif command -v open >/dev/null 2>&1; then
        open "$URL" >/dev/null 2>&1 &
    else
        echo "Ouvrez cette adresse manuellement dans votre navigateur : $URL"
    fi
else
    echo "Le serveur met du temps à démarrer. Ouvrez manuellement : $URL"
    echo "(journal : /tmp/humana-essentiel-serve.log)"
fi

echo
echo "Vous pouvez fermer cette fenêtre pour arrêter l'application."
wait "$SERVER_PID"
