+++
title = "Решение задание 2 Первый отборочный этап(Современныеasdlfkj сетевые технологии 2025)"
date = 2025-04-07
[taxonomies]
tags = ["ansible", "ssh", "debian"]
authors = ["Jahongir Ahmadaliev"]
+++

# Задание 
Вам необходимо создать топологию сети, состоящую из трёх машин. Используйте любую ОС семейства Linux, одну машину используйте как сервер, остальные – как клиенты. Установите и настройте Ansible, напишите плейбук, при запуске которого на сервер в папку /etc/ansible/ITPlanet с клиентов должна собираться следующая информация: 
	 IP адреса клиентов; 
	 версия операционной системы клиентов; 
	 имена клиентов; 
	 количество свободного места на диске

# Решение
## Лаборатория

В качестве операционной системы я использую Debian 12. Создаем три виртуальных машины ![hmm](https://i.ibb.co/Hf65rk0k/Pasted-image-20250307144329.png)

Временно настроил NAT и скачиваем Ansible.  
Если вникать, то вот так:

```
auto enp0s3 
iface enp0s3 inet dhcp
```

А дальше для всех клиентов и сервера настроил, выбрал Internal Network и название сети одна и та же, задал IPv4 в /etc/network/interfaces:

```
auto enp0s3
iface enp0s3 inet static
    address 192.168.1.10
    netmask 255.255.255.0
```
Также для всех машин с определенными ipv4

Далее:
```
systemctl restart networking
```

После рестарта networking видим:

Клиент 1 ![hmm](https://i.ibb.co/N637BV3B/Pasted-image-20250307203748.png)

Клиент 2 ![hmm](https://i.ibb.co/dwZf0r44/Pasted-image-20250307205412.png)

Сервер ![hmm](https://i.ibb.co/fzFG0mJR/Pasted-image-20250307205433.png)

Пинги идут
![](https://i.ibb.co/B2pfzNTs/Pasted-image-20250309223318.png)

## Настройка 

Настроим клиентов:

```
useradd ansible   # создали пользователя ansible 
usermod -aG sudo ansible # добавили его в группу sudo
echo "ansible ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/ansible  # sudo без пароля
```

Так и для другого клиента.

Настроим сервер: Создаем SSH ключ и отправляем клиентам публичный ключ

```
ssh-keygen -t rsa -b 4096
ssh-copy-id ansible@192.168.1.11
ssh-copy-id ansible@192.168.1.12
```
 ![](https://i.ibb.co/7t6kvsbd/Pasted-image-20250309224858.png)
 

```bash
mkdir -p /etc/ansible/ITPlanet # дальше будем работать в директории /etc/ansible
```

Файл main.yml

```
- name: get info
  hosts: clients
  become: yes  # Используем привилегии root
  gather_facts: yes  # Получаем базовые факты
  serial: 1  # Обрабатываем по одному из-за нехватки ресурсов, но его можно отключить
  
  tasks:
    - name: ip  # Получаем IP-адрес клиента
      shell: hostname -I | awk '{print $1}'
      register: client_ip
    
    - name: ОС  # Узнаем версию операционной системы
      shell: cat /etc/os-release | grep "PRETTY_NAME" | cut -d= -f2 | tr -d \"
      register: os_version
    
    - name: hostname  # Получаем имя хоста
      shell: hostname
      register: hostname
    
    - name: free space  # Проверяем свободное место на диске
      shell: df -h / | tail -n 1 | awk '{print $4}'
      register: free_space
    
    - name: files  # Сохраняем собранную информацию в файл
      copy:
        content: |
          Hostname: {{ hostname.stdout }}
          IPv4: {{ client_ip.stdout }}
          ОС: {{ os_version.stdout }}
          free space: {{ free_space.stdout }}
        dest: "/etc/ansible/ITPlanet/{{ inventory_hostname }}_info.txt"
      delegate_to: localhost
```

Файл hosts:

```
[clients]
client1 ansible_host=192.168.1.11
client2 ansible_host=192.168.1.12
[all:vars]
ansible_user=ansible
```

![](https://i.ibb.co/CKTVy4yQ/Pasted-image-20250309225110.png)

## Запуск и результаты

Дальше запускаем playbook:

```bash
ansible-playbook main.yml
```

![](https://i.ibb.co/hRgDZn86/Pasted-image-20250309225607.png)

Итог:
![](https://i.ibb.co/0pLhcFTm/Pasted-image-20250309225645.png)

