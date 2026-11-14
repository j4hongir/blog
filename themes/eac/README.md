# EAC

Локальная тема технического журнала. Текст, спокойная сетка, два цветовых режима.
JetBrains Mono для всего сайта: текста, заголовков, интерфейса, кода и метаданных.
Локальные variable WOFF2 (100–800): обычный и настоящий курсив, кириллица и латиница.
`font-display: swap`; предзагрузка только обычного начертания, курсив — по необходимости.
Без шрифтовых CDN, UI-библиотек, фоновых изображений и обязательного JS для чтения.
`prism` остаётся нетронутым submodule; тема выбирается через `theme = "eac"`.

## Разработка

```sh
zola serve
zola build
zola check --skip-external-links
```

Используется Zola 0.22.1, как в существующем GitHub Actions workflow.
Навигация задаётся в `extra.sam_menu`; внутренние пути относительны к `base_url`,
поэтому работают и `/blog/` на GitHub Pages, и корень собственного домена.

- Цвета, размеры, сетка и печать: `static/style.css`.
- Тема, копирование кода, оглавление, прогресс, якоря: `static/site.js`.
- Текст главной и внешние ссылки: `[extra.eac]` в `config.toml`.
- Контент записей и прежние опции `show_toc`, `math`, `comments`, `no_header`,
  `no_comments`, `toc`, `show_word_count`, `show_reading_time`, `features` сохранены.
- RSS/Atom, taxonomy feeds, SEO, Open Graph, JSON-LD и Giscus продолжают работать.
- Секции и таксономии поддерживают `paginate_by`; домашняя страница показывает
  последние пять записей без отдельного JS-запроса.
- Фоновые фото, стеклянные карточки и прежний splash-экран намеренно заменены.

## Самостоятельные страницы

`templates/certs` и `templates/talks` остаются отдельными Git submodules.
В каждом: `content.html` — разметка, `app.js` — существующий источник данных GitHub
и интерфейс. Zola включает их через `certs.html` / `talks.html`. `index.html` —
самостоятельная версия, которая использует те же файлы и собственные копии стилей.

После изменения общего оформления или навигации:

```sh
python3 scripts/sync_submodule_styles.py
```

Скрипт обновляет standalone-оболочку, `assets/style.css`, `assets/site.js` и `assets/fonts/`.
Коммитить изменения `certs` и `talks` нужно внутри соответствующих репозиториев,
а затем обновить их gitlink в основном репозитории. Иначе CI получит старые версии.
Репозитории и ветка для GitHub API находятся в начале `app.js`.

Список сертификатов сохраняет категории и ссылки на PDF. Доклады сохраняют
опциональный `meta.json` (`title`, `desc`, `tags`, `date`), README, исходники и поиск
PDF на один уровень вглубь. Для Markdown локально сохранён прежний marked 9.1.6;
HTML обрабатывается DOMPurify 3.3.1. Сетевые ошибки, пустые ответы и частично
загруженные категории отображаются явно, с повтором загрузки.

Выбор темы хранится в `localStorage`, системная тема используется по умолчанию.
У standalone-страниц на другом origin настройка хранится отдельно.

## Регрессионные проверки

```sh
zola build
python3 tests/check_build.py public
ZOLA_BINARY=zola python3 tests/check_features.py
```

`check_build.py` проверяет локальные ссылки, якоря, метаданные и JSON-LD.
С `--baseline PATH` он также сравнивает маршруты, содержимое статей и XML-файлы
со старой сборкой. `check_features.py` использует отдельную временную копию для
пагинации, разметки, формул, root-domain URL и отключённых настроек темы.

`tests/browser.cjs` использует Playwright и Chromium. `PLAYWRIGHT_MODULE` задаёт
путь к установленному пакету, `BROWSER_PATH` — к браузеру; это только QA-зависимости,
для сборки сайта они не нужны. Перед запуском подготовьте `.redesign/preview`
через `zola build --base-url http://127.0.0.1:4173/blog --output-dir .redesign/preview`,
запустите `check_features.py` для `.redesign/fixture-preview` и поместите KaTeX
0.16.9 `katex.min.js`, `auto-render.min.js` в каталог `KATEX_FIXTURE_DIR`.
Тест сам запускает и останавливает локальный сервер. GitHub API подменяется
содержимым локальных submodules; отдельно тестируются пустые ответы и ошибки.
