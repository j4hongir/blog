# DevSecOps Notes

Технический блог о DevOps, Security, Linux и смежных темах.

https://jahongir.ru

## Стек

- Zola (Static Site Generator)
- Тема Prism
- Деплой: Vercel/Netlify/GH-pages

## Локальная разработка

```bash
# Установка Zola (macOS)
brew install zola

# Установка Zola (Linux)
wget -q -O - https://github.com/getzola/zola/releases/download/v0.18.0/zola-v0.18.0-x86_64-unknown-linux-gnu.tar.gz | tar xzf - -C /usr/local/bin

# Запуск
git clone https://github.com/jahamars/blog.git

cd blog

git submodule add https://github.com/Jahamars/zola-prism.git themes/prism

zola serve
```


## Структура

```
content/blog/     # Статьи
static/photos/    # Изображения
config.toml       # Конфигурация
```

## Соавторство

Блог открыт для соавторства. Читайте [CONTRIBUTING.md](CONTRIBUTING.md)

## Автор

Jahongir Ahmadaliev  
Email: jahamarsi@gmail.com

## Лицензия

MIT
