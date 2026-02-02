+++
title = "Решение задания 2 IT-Планета 2025: Информационная безопасность"
date = 2025-04-07
[taxonomies]
categories = ["tech"]
tags = ["infosec", "openvpn", "redos"]
authors = ["Jahongir Ahmadaliev"]
+++

# Задание
Компания пригласила вас для выполнения настройки компонентов обеспечения информационной безопасности. В компании было закуплены новые компьютеры, на которых было установлена операционная система REDOS. Ваша задача – настроить межсетевое экранирование, виртуальную частную сеть. В сети участвуют два компьютера через открыто локальную сеть 10.0.0.0/24. Туннель должен быть 10.1.1.0/32. Туннель поднимается автоматически после запуска машины (планировщик задания). Условные обозначения – Компьютер А и Компьютер Б. На компьютере А установлено два интерфейса, один из которых может ходить в глобальную сеть, компьютер Б ходит в глобальную сеть через компьютер А. На компьютере А настроен NAT. Настройки межсетевого экранирования настраивается средством iptables и применяются каждый раз как перезагружается компьютер. Компания не хочет, что бы пользователи ходили на ресурсы социальных сетей (vk, ok, mail). Трафик по туннелю должен быть зашифрован и использовалась программа openvpn. По результатам работы необходимо подготовить отчет, где необходимо отобразить все ваши действия и где каждый раздел отмечает настройку отдельного компонента или технологии. Каждый раздел должен быть протестирован.

# Решение


## Среда 
Изначально мне надо поднять среду где мы будем делать все эти монипуляции , операционка у нас REDos (server) средство виртуализации virtualbox 
я решил использовать только cli 

вот такие настройки виртуальных машин я ставил 

![pi](https://i.ibb.co/Z6Wt94sc/Pasted-image-20250318214733.png)


настройки виртуальной машины для сервера 


![pi](https://i.ibb.co/23dK3XBM/Pasted-image-20250318214757.png)
настройки для клиента 


также использовал функцию port forwarding чтобы удобно подключится из внешнего терминала 
также я запустил sshd сервис на обоих машинах чтобы легко подключится с одного на другое 

все команды которые выводятся выполнился под root

## сети 

сразу же после запуска надо настроит сети , так как в redos есть демон network manager по дефолту будем использовать его 

### настройки для сервера
настройка для интерфейса который имеет доступ к интернету и получает ip по dhcp
```bash
sudo nmcli connection modify enp0s3 ipv4.method auto
sudo nmcli connection up enp0s3
```

настройка для интерфейса который смотрит внутрь и получает ip статично
```bash
sudo nmcli connection add type ethernet con-name intranet ifname enp0s8 ipv4.addresses 10.0.0.1/24 ipv4.method manual
sudo nmcli connection up intranet
```

### настройки клиента 
```bash
sudo nmcli connection add type ethernet con-name intranet ifname enp0s3 ipv4.addresses 10.0.0.2/24 ipv4.gateway 10.0.0.1 ipv4.dns 8.8.8.8 ipv4.method manual
sudo nmcli connection up intranet
```

### проверяем что все настройки применились 

настройки сети для сервера 

![pi](https://i.ibb.co/S4zHSvQL/Pasted-image-20250318215819.png)


настройки клиента 

![pi](https://i.ibb.co/bjv4VHgP/Pasted-image-20250318220315.png)

проверяем ping 

на клиенте 
![pi](https://i.ibb.co/zWcqYfpB/Pasted-image-20250318220409.png)


на сервере 
![pi](https://i.ibb.co/7TWRtfV/Pasted-image-20250318220459.png)

клиент пингует сервера , сервер пингует клиента и также google 
все стабильно идем дальше 

## утилиты

как только мы настроили интернет качаем пакеты 


для сервера 
```
dnf install wget  # для скачывание easy-rsa 
dnf install openvpn # vpn 
dnf install iptables-services # deamon для автозапуска iptables 
dnf install traceroute # для проверки 
```

для клиента 
```
dnf install openvpn
```

также нам нужен будет easy-rsa о нем я упомянул ниже в этапе настройки 

![pi](https://i.ibb.co/QF0j2cCM/Pasted-image-20250318221326.png)

у обоих машинах все установился нормально без заморочек идем дальше 
## настройка openvpn сервера, клиента  и iptables

для генерации ключей центров сертификаций и прочей возни для безопасности качаем easy-rsa как архив
```bash
wget https://github.com/OpenVPN/easy-rsa/archive/master.zip
```

распакуем 

```bash 
unzip master.zip
```

![pi](https://i.ibb.co/S7HBS9v2/Pasted-image-20250318221722.png)

и в итоге у нас вот такой tree директории c easy-rsa 

```accsi

[root@vbox ]# cd easy-rsa-master/
[root@vbox ]# tree

├── build
│   ├── build-dist.sh
│   └── Building.md
├── ChangeLog
├── COPYING.md
├── distro
│   ├── README
│   └── windows
├── doc
├── easyrsa3
│   ├── easyrsa
│   ├── openssl-easyrsa.cnf
│   ├── vars.example
│   └── x509-types
│       ├── ca
│       ├── client
│       ├── code-signing
│       ├── COMMON
│       ├── email
│       ├── kdc
│       ├── server
│       └── serverClient
├── KNOWN_ISSUES
├── Licensing
│   └── gpl-2.0.txt
├── op-test.sh
├── README.md
├── README.quickstart.md
├── release-keys
│   └── README.md
├── wop-test.bat
└── wop-test.sh
```

нас интересует папка easyrsa3 далше все действие делаем именна из нее


```bash
# Инициализация PKI
./easyrsa init-pki
```

```bash
# Создание CA
./easyrsa build-ca
```

```bash
# Создание сертификата сервера
./easyrsa build-server-full server nopass
```

```bash
# Создание сертификата клиента
./easyrsa build-client-full client nopass
```

```bash
# Создание файла DH
./easyrsa gen-dh
```

```bash
# Создание TLS-ключа
openvpn --genkey --secret pki/ta.key
```

 далее создаем нужные директории и переносим все ключи туда 

```
# Копирование файлов сервера
cp pki/ca.crt /etc/openvpn/server/
cp pki/issued/server.crt /etc/openvpn/server/
cp pki/private/server.key /etc/openvpn/server/
cp pki/dh.pem /etc/openvpn/server/
cp pki/ta.key /etc/openvpn/server/

# Копирование файлов клиента в отдельную директорию
cp pki/ca.crt /etc/openvpn/client/
cp pki/issued/client.crt /etc/openvpn/client/
cp pki/private/client.key /etc/openvpn/client/
cp pki/ta.key /etc/openvpn/client/
```
да у меня на сервере есть директория клиента позже объясню зачем я не передавал напрямую

конфигурационный файл для сервера 

/etc/openvpn/server/server.conf 

```
port 1194
proto udp
dev tun
ca ca.crt
cert server.crt
key server.key
dh dh.pem
server 10.1.1.0 255.255.255.0
ifconfig-pool-persist ipp.txt
push "redirect-gateway def1 bypass-dhcp"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"
keepalive 10 120
tls-auth ta.key 0
cipher AES-256-CBC
auth SHA256
compress lz4-v2
push "compress lz4-v2"
user nobody
group nobody
persist-key
persist-tun
status openvpn-status.log
verb 3
```

конфиг для клиента 

/etc/openvpn/client/client.conf

```
client
dev tun
proto udp
remote 10.0.0.1 1194
resolv-retry infinite
nobind
persist-key
persist-tun
remote-cert-tls server
cipher AES-256-CBC
auth SHA256
compress lz4-v2
verb 3
```

дальше я написал простой скрипт на bash чтобы прописать в конфиг клиента ключи чтобы не ташить их отдельно 

```bash
eecho '<ca>' >> /etc/openvpn/client/client.conf
cat /etc/openvpn/client/ca.crt >> /etc/openvpn/client/client.conf
echo '</ca>' >> /etc/openvpn/client/client.conf

echo '<cert>' >> /etc/openvpn/client/client.conf
cat /etc/openvpn/client/client.crt >> /etc/openvpn/client/client.conf
echo '</cert>' >> /etc/openvpn/client/client.conf

echo '<key>' >> /etc/openvpn/client/client.conf
cat /etc/openvpn/client/client.key >> /etc/openvpn/client/client.conf
echo '</key>' >> /etc/openvpn/client/client.conf

echo '<tls-auth>' >> /etc/openvpn/client/client.conf
cat /etc/openvpn/client/ta.key >> /etc/openvpn/client/client.conf
echo '</tls-auth>' >> /etc/openvpn/client/client.conf
echo 'key-direction 1' >> /etc/openvpn/client/client.conf

```

помните мы копировали в директория client клуючи для клиента они как раз для этого 

даем права для запуска и запускаем скрипт и если скрипт молчит и не показывает ничего то все хорошо 

```
chmod +x ./script.sh
./script.sh
```

в итоге у нас получится такой длинный конфиг со всемы нужными публичными ключами
![pi](https://i.ibb.co/Qvwc11mV/Pasted-image-20250318223629.png)
это не все но поверте мне на слово 

в итоге у нас получилось вот такой tree

```
client  easy-rsa-master  master.zip  server
[root@vbox openvpn]# tree
.
├── client
│   ├── ca.crt
│   ├── client.crt
│   ├── client.key
│   ├── client.conf
│   ├── hmm.sh
│   └── ta.key
├── easy-rsa-master
│   ├── build
│   │   ├── build-dist.sh
│   │   └── Building.md
│   ├── ChangeLog
│   ├── COPYING.md
│   ├── distro
│   │   ├── README
│   │   └── windows
│   ├── doc
│   │   ├── EasyRSA-Advanced.md
│   │   ├── EasyRSA-Contributing.md
│   │   ├── EasyRSA-Readme.md
│   │   ├── EasyRSA-Renew-and-Revoke.md
│   │   ├── EasyRSA-Upgrade-Notes.md
│   │   ├── Hacking.md
│   │   ├── Intro-To-PKI.md
│   │   └── TODO
│   ├── easyrsa3
│   │   ├── easyrsa
│   │   ├── openssl-easyrsa.cnf
│   │   ├── pki
│   │   │   ├── ca.crt
│   │   │   ├── certs_by_serial
│   │   │   │   ├── 2C889B5BBEB0183E1F9C3F061209C4FE.pem
│   │   │   │   └── 2D557E13C414164291D000A634D7EF48.pem
│   │   │   ├── dh.pem
│   │   │   ├── index.txt
│   │   │   ├── index.txt.attr
│   │   │   ├── index.txt.attr.old
│   │   │   ├── index.txt.old
│   │   │   ├── inline
│   │   │   │   └── private
│   │   │   │       ├── client.inline
│   │   │   │       ├── README.inline.private
│   │   │   │       └── server.inline
│   │   │   ├── issued
│   │   │   │   ├── client.crt
│   │   │   │   └── server.crt
│   │   │   ├── private
│   │   │   │   ├── ca.key
│   │   │   │   ├── client.key
│   │   │   │   └── server.key
│   │   │   ├── reqs
│   │   │   │   ├── client.req
│   │   │   │   └── server.req
│   │   │   ├── revoked
│   │   │   │   ├── certs_by_serial
│   │   │   │   └── private_by_serial
│   │   │   ├── serial
│   │   │   ├── serial.old
│   │   │   ├── ta.key
│   │   │   └── vars.example
│   │   ├── vars.example
│   │   └── x509-types
│   │       ├── ca
│   │       ├── client
│   │       ├── code-signing
│   │       ├── COMMON
│   │       ├── email
│   │       ├── kdc
│   │       ├── server
│   │       └── serverClient
│   ├── KNOWN_ISSUES
│   ├── Licensing
│   │   └── gpl-2.0.txt
│   ├── op-test.sh
│   ├── README.md
│   ├── README.quickstart.md
│   ├── release-keys
│   │   └── README.md
│   ├── wop-test.bat
│   └── wop-test.sh
├── master.zip
└── server
    ├── ca.crt
    ├── dh.pem
    ├── ipp.txt
    ├── openvpn-status.log
    ├── server.conf
    ├── server.crt
    ├── server.key
    ├── ta.key
    └── tut.conf

26 directories, 97 files
[root@vbox openvpn]# 
```


передаем конфиг клиента по ssh 

```
scp /etc/openvpn/client/client.conf root@10.0.0.2:/etc/openvpn/client/

```

в клиенте все легко 
```
[root@localhost openvpn]# tree
.
└─── client
      └── client.conf
```


### Настройка iptables 

настроим NAT
```
iptables -t nat -A POSTROUTING -s 10.1.1.0/24 -o eth0 -j MASQUERADE
iptables -A FORWARD -i tun0 -o eth0 -j ACCEPT
iptables -A FORWARD -i eth0 -o tun0 -m state --state RELATED,ESTABLISHED -j ACCEPT
```

запретим указанных сайтав

```
iptables -A FORWARD -d vk.com -j REJECT
iptables -A FORWARD -d ok.ru -j REJECT
iptables -A FORWARD -d mail.ru -j REJECT
```

и сохранение для автозапуска 

```
iptables-save > /etc/sysconfig/iptables
```

и ставим на автозапуск

```bash
systemctl enable iptables
```

## Запуск 

далее все запускаем 

сервер 

```bash
systemctl start openvpn-server@server
```

клиент

```bash
systemctl start openvpn-client@client
```

проверяем

на серврере 
```
systemctl status openvpn-server@server
``` 
![pi](https://i.ibb.co/Ld7BPC0x/Pasted-image-20250318225301.png)

на клиенте 

```bash
systemctl status  openvpn-client@client
```

![pi](https://i.ibb.co/1GCHcWKB/Pasted-image-20250318225409.png)


## автозапуск 

на сервере есть два сервиса или демона для автозапуска это 

```
systemctl enable openvpn-server@server  # для openvpn
systemctl enable iptables  # для iptables его мы отдельно скачали в начале 
```

а на клиенте 1

```
systemctl enable openvpn-client@client
```

теперь каждый при перезапуске поднимается tunel и применяется настройки iptables автоматически 


## проверка 


самое главно зачем мы суюда шли проверка что все корректно работает 

я переименовал устройства чтобы было проше различить 

настройки сети 

сервер 
![pi](https://i.ibb.co/8LXKw1W4/Pasted-image-20250318231058.png)


клиент 
![pi](https://i.ibb.co/jvzTk60V/Pasted-image-20250318231119.png)

как вы видите в обоих машинах появился интерфейс tun0 с нужным нам ip адресами это хороший знак 

также они пингуют друг друга по тунели
![pi](https://i.ibb.co/TqM2Qn93/Pasted-image-20250318231958.png)


для проверки настроек iptables 

![pi](https://i.ibb.co/mrhNH20g/Pasted-image-20250318231335.png)


 как вы видите ниже firewall который мы настроили не дает доступ заданным сайтам ok.ru mail.ru vk.ru
 но дает доступ к сайтам google.com и ya.ru так и надо было
 ![pi](https://i.ibb.co/dJwHGs5y/Pasted-image-20250318231728.png)

traceroute 
![pi](https://i.ibb.co/8gdLy8c2/Pasted-image-20250318232141.png)


здесь мы видим полный путь откуда проходит наш трафик 

там и наш tunel 10.1.1.1 это значит подключение правильно настроено и все хорошо 

вот и все 


## Список литературы 

https://redos.red-soft.ru/base/redos-8_0/8_0-network/8_0-sett-vpn/8_0-openvpn/
https://gist.github.com/laurenorsini/9925434
https://habr.com/ru/articles/233971/
https://help.ubuntu.ru/wiki/openvpn
