# Руководство для соавторов

## Процесс

1. Сделайте форк репозитория
2. Создайте ветку для вашей статьи
3. Добавьте файл в `content/blog/`
4. Откройте Pull Request

## Формат статьи

### Имя файла

`some_article_name.md` — только строчные буквы и подчёркивания.

### Frontmatter

Обязательные поля в начале файла:

```toml
+++
title = "Название вашей статьи"
date = 2025-01-27
[taxonomies]
categories = ["tech"]
tags = ["docker", "linux"]
authors = ["Ваше Имя"]
+++
```

**Категории**: `tech` или `nontech`  
**Теги**: любые релевантные теги

### Содержание

**Язык**: русский или английский  
**Темы**: DevOps, Security, Linux, Cloud, сети, programming или в общем смежные технические темы

Используйте заголовки `##` и `###` для структуры.

### Код

Указывайте язык:

````markdown
```bash
systemctl status nginx
```
````

### Картинки

Размещайте в `static/photos/`, используйте понятные имена:

```markdown
![Описание](/photos/your-image.png)
```

---

Отправляя PR, вы соглашаетесь с публикацией контента под лицензией блога.


---

---


# Contributing Guide

## Process

1. Fork the repository
2. Create a branch for your article
3. Add the file to `content/blog/`
4. Open a Pull Request

## Article Format

### Filename

`some_article_name.md` — lowercase letters and underscores only.

### Frontmatter

Required fields at the top of the file:

```toml
+++
title = "Your Article Title"
date = 2025-01-27
[taxonomies]
categories = ["tech"]
tags = ["docker", "linux"]
authors = ["Your Name"]
+++
```

**Categories**: `tech` or `nontech`  
**Tags**: any relevant tags

### Content

**Language**: Russian or English  
**Topics**: DevOps, Security, Linux, Cloud, networking, programming, or related technical topics

Use `##` and `###` headings for structure.

### Code

Specify the language:

````markdown
```bash
systemctl status nginx
```
````

### Images

Place them in `static/photos/`, use clear names:

```markdown
![Description](/photos/your-image.png)
```

---

By submitting a PR, you agree to publish your content under the blog's license.
