+++
title = "Cинхронизируем obsidian быстро, безопасно, удобно и бесплатно"
date = 2026-03-10
[taxonomies]
categories = ["tech"]
tags = ["obsidian", "git", "git-crypt"]
authors = ["Jahongir Ahmadaliev"]
+++

В этом небольшом гайде расскажу как я синхронизирую свои заметки Obsidian сохраняя все 4 свойства одновременно. Мне кажется это золотой стандарт для настройки синхронизации Obsidian и в этом гайде поэтапно расписал как провернуть эту схему у себя.

С чем имеем дело:
- редактор заметок, в моём случае Obsidian, но подойдёт любой; в Obsidian есть плагин который упростит работу с Git до пары кнопок
- git и git хранилище, я использую GitHub, но можно GitLab, Codeberg или любой другой
- git-crypt — утилита для прозрачного шифрования файлов прямо внутри репозитория
- gpg — для генерации асимметричных ключей; если не хочется заморачиваться, можно обойтись симметричным `.bin` ключом
- плагин obsidian git — чтобы пушить и пуллить прямо из Obsidian, без терминала

Как это всё работает: `git-crypt` цепляется к Git через фильтры `clean` и `smudge`. При `git add` файл шифруется AES-256 и уходит на сервер в виде нечитаемого бинарника. При `git pull` — расшифровывается обратно. Ты работаешь с обычными markdown файлами, шифрование происходит незаметно. Плагин Obsidian Git просто вызывает стандартные git-команды изнутри Obsidian, поэтому с git-crypt работает без каких-либо проблем.

### Установка

arch based 
```bash
sudo pacman -S gnupg git-crypt
```

debian based 
```bash
sudo apt install gnupg git-crypt
```

Сначала фиксим права на папку, без этого gpg иногда ругается
```bash
chmod 700 ~/.gnupg
find ~/.gnupg -type f -exec chmod 600 {} \;
find ~/.gnupg -type d -exec chmod 700 {} \;
```

Создаём ключ
```bash
gpg --full-generate-key
```

В меню:
- тип 1 - rsa 
- размер 4096 
- срок 0 - не истекает
- имя и email
- придумываем пароль - пароль понадобится при каждом git-crypt unlock

Смотрим что создалось
```bash
gpg --list-secret-keys --keyid-format long
```

```
sec   rsa4096/BC1669B94DC2FA3B 2026-03-10 [SC]
      A24F8B816C123B0B342234555C2ACA254BC1669B
uid   user <mail@email.com>
```
email отсюда понадобится на следующем шаге

По желанию можно настроить кэш пароля на 24 часа, чтобы не вводить при каждом unlock
```bash
echo "default-cache-ttl 86400" >> ~/.gnupg/gpg-agent.conf
echo "max-cache-ttl 86400" >> ~/.gnupg/gpg-agent.conf
gpgconf --reload gpg-agent
```

## Репозиторий

```bash
cd ~/notes
git init
git-crypt init
git-crypt add-gpg-user --trusted mail@email.com
```

Создаём .gitignore исключаем системные файлы Obsidian которые не нужно синхронизировать
```
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/cache
.trash/
```

Создаём .gitattributes говорим git-crypt что шифровать а что нет 
```
.gitattributes !filter !diff
.gitignore !filter !diff

*.md     filter=git-crypt diff=git-crypt
*.canvas filter=git-crypt diff=git-crypt
*.png    filter=git-crypt diff=git-crypt
*.jpg    filter=git-crypt diff=git-crypt
*.jpeg   filter=git-crypt diff=git-crypt
*.pdf    filter=git-crypt diff=git-crypt
```

Порядок коммитов важен, сначала только .gitattributes потом остальное. Если закоммитить всё разом, git-crypt не успевает применить фильтры и файлы уйдут в открытом виде:
```bash
git add .gitattributes
git commit -m "$(date '+%Y-%m-%d %H:%M')"

git add .
git commit -m "$(date '+%Y-%m-%d %H:%M')"
```

Проверяем статус шифрования
```bash
git-crypt status | grep WARNING
```

Пушим
```bash
git remote add origin git@github.com:username/notes.git
git branch -M main
git push -u origin main
```

## Obsidian Git плагин

Открываем Obsidian, идём в Settings → Community Plugins → Browse, ищем Git (автор Vinzent), устанавливаем и включаем.
В настройках плагина настраиваем как нам удобно.
Теперь плагин сам тянет изменения при запуске Obsidian и автоматически коммитит и пушит по расписанию. 
Вручную можно через Ctrl+P  "Obsidian Git: Commit-and-sync" или кнопку в интерфейсе.

Важно: открывать Obsidian только после git-crypt unlock в терминале. Если открыть раньше — увидишь GITCRYPT... вместо заметок, плагин будет пытаться запушить мусор. Закрыть Obsidian, разблокировать в терминале, открыть снова.
## Pre-commit хук

Хук блокирует коммит если файлы которые должны быть зашифрованы идут в открытом виде. Создаём файл .githooks/pre-commit
```bash
mkdir -p .githooks
touch .githooks/pre-commit
chmod +x .githooks/pre-commit
```

Содержимое .githooks/pre-commit
```bash
#!/bin/bash
for file in $(git diff --cached --name-only); do
    if git check-attr filter "$file" | grep -q "git-crypt"; then
        magic=$(git show ":$file" 2>/dev/null | head -c 9)
        if [ "$magic" != $'\x00GITCRYPT' ]; then
            echo "files '$file' is not encrypted man be carefull"
            exit 1
        fi
    fi
done
exit 0
```

```bash
git config core.hooksPath .githooks
git add .githooks/pre-commit
git commit -m "$(date '+%Y-%m-%d %H:%M')"
```

## Перенос на другое устройство

На старом устройстве:
```bash
gpg --export-secret-keys --armor mail@email.com > ~/key.asc
```

Копируем на новое через `scp` или флешку. На новом:

```bash
gpg --import ~/my-gpg-key.asc
git clone git@github.com:username/notes.git
cd notes
git-crypt unlock
```

Удаляем файл ключа с обоих устройств:

```bash
rm ~/my-gpg-key.asc
```

Открываем Obsidian, выбираем "Open folder as vault", указываем папку с клонированным репозиторием. Устанавливаем плагин Obsidian Git, выставляем те же настройки.

## Бэкап GPG ключа

Без ключа и пароля доступ к заметкам потерян навсегда
```bash
gpg --export-secret-keys --armor mail@email.com > ~/backup-gpg.asc
```

Кладём в менеджер паролей или на внешний диск, после этого удаляем
```bash
rm ~/backup-gpg.asc
```

## Cимметричный ключ без GPG

Если не хочется разбираться с GPG git-crypt умеет работать с обычным .bin ключом. 
```bash
git-crypt export-key ~/key.bin
```

Удобный хак переводим его в base64 и храним как строку в менеджере паролей, не нужно таскать бинарный файл
```
base64 -i ~/key.bin
```

На новом устройстве:
```bash
echo "base64 string" | base64 -d > key.bin
git-crypt unlock key.bin
```
Минус: ключ не защищён паролем, если строка утечёт из менеджера паролей, заметки расшифруются.
