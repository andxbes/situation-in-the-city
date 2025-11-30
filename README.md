
Там без рута ставится termux  + termux:boot +  termux:API

Далее в termux 
``` bash
pkg update && pkg upgrade
pkg i termux-api 
pkg install openssh
passwd # задаем паролль для ssh 
mkdir -p ~/.termux/boot/
nano ~/.termux/boot/start-sshd
```
## пишем автолоадер для ssh 
``` bash
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock
sshd
```
Делаем запускаемым 
`chmod +x ~/.termux/boot/start-sshd`

https://wiki.termux.com/wiki/Termux:Boot 

и затем мы можем спокойно работать с консоли с пк с приставкой , юзера нет 
`ssh -p 8022  192.168.1.61`

## Run in termux 

``` bash

pkg update && pkg upgrade 
pkg install proot-distro
proot-distro install ubuntu
proot-distro login ubuntu
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
exit
proot-distro login ubuntu
apt update 
apt install libatomic1
apt install libstdc++6 
nvm install 22

git clone https://github.com/andxbes/situation-in-the-city.git 
cd situation-in-the-city

npm i 
nano .env 
npm run build 
#npm run start
```

`nano ~/.termux/boot/start-sshd` 


``` bash
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock
sshd

proot-distro login ubuntu -- bash -c "
    export NVM_DIR=\"\$HOME/.nvm\"; # Убедитесь, что NVM_DIR установлен
    [ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\"; # Загружаем nvm
    [ -s \"\$NVM_DIR/bash_completion\" ] && \\. \"\$NVM_DIR/bash_completion\"; # Загружаем автодополнение для bash, если нужно
    nvm use --lts; # Активируем LTS-версию Node.js

    cd ~/situation-in-the-city && \
    git pull && \
    npm i && \
    npm run build && \
    npm run start
"
```
