+++
title = "Аналог Windows Recall на Линукс без ИИ"
date = 2026-02-27
[taxonomies]
categories = ["tech"]
tags = ["recall", "ocr", "bash", "guide"]
authors = ["Jahongir Ahmadaliev"]
+++

Да-да, вы всё правильно прочитали. Аналог того самого функционала без облаков, без подписки, без нейросетей и без кучи зависимостей. Причём реализовать это оказалось не так уж сложно.

Для тех кто не в курсе Windows Recall это функция которую Microsoft анонсировала в 2024 году для Copilot+ PC. Суть простая: система периодически делает скриншоты экрана, распознаёт на них текст и контент с помощью ИИ, и потом ты можешь найти всё что когда-либо видел на экране просто написав запрос. Типа "найди тот сайт с ценами который я смотрел на прошлой неделе"  и оно находит. Звучит удобно, но вызвало кучу споров по части приватности, потом фичу откладывали, переделывали и так далее.

Скажу честно я сам Recall никогда не исползовал. Перешёл на линукс давно, виндой не пользуюсь совсем. Читал про это в статьях и новостях, смотрел пару видосов, суть понял.

И вот тут началось интересное. У меня за несколько лет накопилось определённое количество скриптов под мой wayland-сетап скриншоты, буфер обмена и всякое такое. В какой-то момент я дописал к ним ещё немного логики и внезапно получилось что-то очень похожее на этот самый Recall. Не специально, просто так вышло.

Сразу предупрежу это не универсальное решение и подойдёт не всем. Это заточено под конкретный стек: wayland, tofi, grim, cliphist. Если у тебя gnome или kde возможно придётся адаптировать или вообще забить. Но если ты уже сидишь на похожем наборе утилит, внедрить это будет максимально легко, и ещё это не "код ради кода". Я это реально использую.


## Из чего это вообще состоит
Вся система держится на нескольких утилитах которые в wayland-среде и так часто стоят:

- `grim` - делает скриншот области экрана
- `slurp` - выделение области мышкой
- `tesseract` - OCR, распознаёт текст на изображении
- `tofi` - dmenu-подобный лаунчер, через него ищем
- `wl-clipboard` - копирование в буфер
- `cliphist` - история буфера обмена
- `notify-send` - уведомления

Всё это отдельные маленькие unix утилиты которые делают одно дело и делают его хорошо. Compose their powers, как говорится.

## Как это работает

Система из двух скриптов. Первый `screen.sh`, он делает скриншот и сразу же в фоне запускает tesseract который распознаёт текст и сохраняет его рядом с картинкой как `.txt` файл. То есть у нас получается пара: `screenshot-2025-03-27-143055.png` и `screenshot-2025-03-27-143055.txt`.

Второй скрипт `ssearch.sh`, он берёт все эти `.txt` файлы, строит из них список для tofi и ты можешь по тексту найти нужный скриншот. Нашёл - картинка открывается, текст копируется в буфер. Вот и весь recall.


## screen.sh скриншот с OCR

```bash
#!/bin/bash
set -euo pipefail

SCREENSHOT_DIR="${SCREENSHOT_DIR:-$HOME/Pictures/screens}"
OCR_LANG="${OCR_LANG:-rus+eng}"
SLURP_ARGS=(-d -b 1B1F2866 -c 89b4faff -w 1)
GRIM_ARGS=(-t png -l 3)

die()  { notify-send "screen.sh" "$1" -i dialog-error -t 4000; exit 1; }
need() { for cmd in "$@"; do command -v "$cmd" &>/dev/null || die "missing: $cmd"; done; }
```

Переменные окружения чтобы можно было переопределить без редактирования скрипта. `OCR_LANG=rus+eng` tesseract будет распознавать и русский и английский одновременно, это важно потому что у меня на экране вперемешку.

```bash
run_ocr() {
    tesseract "$1" - -l "$OCR_LANG" --psm 3 2>/dev/null \
        | grep -v '^[[:space:]]*$' \
        | sed 's/[[:space:]]\+/ /g; s/^ //; s/ $//'
}
```

`--psm 3` это автоматический режим разметки страницы, подходит для произвольного контента. stderr уходит в `/dev/null` потому что tesseract любит туда писать мусор даже когда всё нормально. `grep` и `sed` убирают пустые строки и лишние пробелы.

```bash
save_sidecar() {
    run_ocr "$1" > "${1%.png}.txt" 2>/dev/null || true
}
```

Сайдкар создаётся всегда даже если tesseract ничего не нашёл, файл создаётся пустым. Это нужно чтобы индексер в `ssearch.sh` понял что этот PNG уже обработан и не трогал его повторно.

```bash
command -v tesseract &>/dev/null && { save_sidecar "$FILEPATH" & disown; }
```

`& disown` запускаем в фоне и отцепляем от текущего процесса. Уведомление о скриншоте появляется сразу, tesseract работает параллельно и не тормозит.

Уведомление кстати интерактивное:

```bash
ACTION=$(notify-send "screenshot saved" "$FILENAME" \
    -i "$FILEPATH" \
    -t 7000 \
    -A "default=open folder" \
    -A "edit=edit" \
    -A "ocr=copy text")

case "${ACTION:-}" in
    default) open_folder "$FILEPATH" ;;
    edit)    open_editor "$FILEPATH" ;;
    ocr)     ocr_to_clipboard "$FILEPATH" ;;
esac
```

Три кнопки открыть папку, открыть в редакторе (swappy по дефолту), или сразу OCR в буфер. Это работает через libnotify action, нужен swaync или dunst версии которая поддерживает actions.

Есть ещё режим `--ocr` он не сохраняет файл вообще, просто выделяешь область и текст сразу в буфер. Удобно когда надо быстро скопировать текст с картинки.

## ssearch.sh поиск по истории

```bash
if [[ "${1:-}" == "--index" ]]; then
    while IFS= read -r png; do
        txt="${png%.png}.txt"
        [[ -f "$txt" ]] && continue
        run_ocr "$png" > "$txt" 2>/dev/null || true
    done < <(find "$SCREENSHOT_DIR" -name "screenshot-*.png" -type f | sort)
fi
```

`--index` нужен если у тебя уже есть накопленные скриншоты без `.txt` файлов рядом. Запускаешь один раз, он всё обрабатывает. Проверяет наличие `.txt` перед тем как запускать tesseract не делает лишнюю работу.

```bash
if [[ "${1:-}" == "--list" ]]; then
    while IFS= read -r txt; do
        png="${txt%.txt}.png"
        [[ -f "$png" ]] || continue
        base=$(basename "$txt" .txt)
        dt="${base#screenshot-}"
        stamp="${dt:0:10} ${dt:11:2}:${dt:13:2}:${dt:15:2}"
        snippet=$(head -3 "$txt" | tr '\n' ' ' | cut -c1-120)
        printf '%s\t%s\t%s\n' "$png" "$stamp" "$snippet"
    done < <(find "$SCREENSHOT_DIR" -name "screenshot-*.txt" -type f | sort -r)
fi
```

`--list` выдаёт TSV  путь к PNG, дата, начало текста. Сортируется по убыванию свежие вверху. `head -3` берёт первые три строки из OCR, этого обычно хватает для превью в tofi.

Основной режим это пайп через tofi:

```bash
selected=$(
    "$0" --list | while IFS=$'\t' read -r png stamp snippet; do
        clean=$(printf '%s' "$snippet" | iconv -f utf-8 -t utf-8 -c 2>/dev/null | tr '\t\n' '  ')
        printf '%s  |  %s\t%s\n' "$stamp" "$clean" "$png"
    done \
    | tofi --prompt-text "> " \
           --fuzzy-match true \
           --auto-accept-single false \
           --width 1100 \
           --height 600
) || exit 0
```

`iconv -f utf-8 -t utf-8 -c` убирает битые байты tesseract иногда выдаёт мусор особенно на плохих скриншотах. `--fuzzy-match true` в tofi позволяет искать не точное вхождение а приблизительное, что очень помогает когда OCR сделал ошибку.

После выбора:

```bash
png=$(printf '%s' "$selected" | awk -F'\t' '{print $NF}')
if [[ -f "$png" ]]; then
    txt="${png%.png}.txt"
    [[ -f "$txt" ]] && cat "$txt" | iconv -f utf-8 -t utf-8 -c | wl-copy
    xdg-open "$png"
fi
```

Текст в буфер, картинка открывается. Можно сразу вставить распознанный текст или посмотреть оригинальный скриншот.

## Установка

Пакеты на Arch:

```bash
sudo pacman -S grim slurp tesseract tesseract-data-rus wl-clipboard libnotify swappy
```

`tesseract-data-eng` скорее всего уже стянется как зависимость, но лучше проверить.

Скрипты кладём куда удобно, делаем исполняемыми:

```bash
chmod +x screen.sh ssearch.sh
```

В hyprland биндим:

```
bind = , Print, exec, ~/wayland/scripts/screen.sh
bind = SHIFT, Print, exec, ~/wayland/scripts/screen.sh --ocr
bind = SUPER, F, exec, ~/wayland/scripts/ssearch.sh
```

Для sway то же самое через `bindsym`.

Если у тебя уже есть куча старых скриншотов:

```bash
./ssearch.sh --index
```

Подождать. Зависит от количества файлов и скорости процессора.

## Что не так и что можно улучшить

OCR работает не идеально. На тёмных темах с маленьким шрифтом tesseract иногда выдаёт полную чушь. Можно покрутить `--psm` и `--oem`, у меня psm 3 работает лучше всего для смешанного контента.
Поиск он по тексту OCR, а не по смыслу. То есть ты должен помнить примерно что там было написано. Но это честно никакого ии, никакого векторного поиска, просто fuzzy match по строке.
Папка со скриншотами со временем разрастается. Можно поставить ротацию через systemd timer или cron удалять что старше N дней. Или просто иногда чистить руками.


скрипты у меня на гитхабе https://github.com/Jahamars/wayland
- https://github.com/Jahamars/wayland/blob/main/scripts/ssearch.sh - поиск 
- https://github.com/Jahamars/wayland/blob/main/scripts/screen.sh - скриншот с OCR
