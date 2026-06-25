#!/bin/bash
echo "Введи GitHub Personal Access Token (ввод скрыт):"
read -s TOKEN
echo ""

REPO_URL="https://simpleqago-svg:${TOKEN}@github.com/simpleqago-svg/inventorytemplessbot.git"

git remote remove github 2>/dev/null || true
git remote add github "$REPO_URL"

echo "Пушим на GitHub..."
git push github main

if [ $? -eq 0 ]; then
  echo "✅ Готово! Код на GitHub."
else
  echo "❌ Ошибка. Проверь токен и попробуй снова."
fi

git remote remove github
