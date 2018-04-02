console.error('LOADED');

var test = () => {

    // var options = {
    //     userIds: [{ username: 'test' }],
    //     numBits: 2048,
    //     passphrase: 'test'
    // };
    // openpgp.generateKey(options).then((keys) => {
    //     const lockedPrivateKey = keys.privateKeyArmored;
    //     const publicKey = keys.publicKeyArmored;
    //     var privKey = openpgp.key.readArmored(lockedPrivateKey).keys[0];
    //     console.error(privKey);
    //     console.error('START');
    //     privKey.decrypt('test');
    //     console.error('DECRYPTED');
    //     console.error(privKey);
    //     // var ops = {
    //     //     privateKey: privKey,
    //     //     passphrase: 'test'
    //     // };
    //     // return openpgp.decryptKey(ops).then((unlockedKey) => {
    //     //     console.log(unlockedKey);
    //     //     return '1';
    //     // });
    // });

    var name = document.querySelector('.name');
    if (!name) {
        alert('You must loggin to encrypt a message');
        return message;
    }
    name = name.firstChild.innerText;
    // GET SESSION KEY
    //return new Promise((resolve, reject)=>{
    browser.storage.sync.get({ users: {} }, items => {
        console.error('1');
        var users = items.users;
        if (!users[name]) {
            alert('You must first register through the options page');
            return message;
        }
        var sessKey = new Uint8Array(16);
        window.crypto.getRandomValues(sessKey);
        var opts = {
            data: sessKey,
            algorithm: 'aes128',
            publicKeys: openpgp.key.readArmored(users[name].publicKey).keys
        };
        console.log('123');
        openpgp.encryptSessionKey(opts).then((keyPack) => {
            console.log('packet');
            console.log(keyPack);
            console.log(users[name].sessionKey);
            console.log((users[name].sessionKey.toString()) );
            var l = [];
            for(let i=0; i<=270; i++){
                l.push(users[name].sessionKey[i]);
            }
            console.log(l);
            var x = Uint8Array.from(l);
            //console.log(error);
            console.log(x);
            console.log(keyPack.message);
            var packs = new openpgp.packet.List();
            packs.read(x);
            // console.log(packs);
            // packs.push(users[name].sessionKey.message.packets[0][0]);
            console.log('THE MESSAGE');
            var xx = new openpgp.message.Message(packs);
            console.log(xx);
            var privKey = openpgp.key.readArmored(users[name].privateKey).keys[0];
            privKey.decrypt('testtest');
            var options = {
                message: xx,
                privateKeys: [privKey]// unlockedKey.Key,
            };
            console.error(options);
            console.error('DECRYPT SESSION KEY');
            // DECRYPT SESSION KEY
            openpgp.decryptSessionKeys(options).then((sessKeysList) => {
                console.error('ENCRYPT MESSAGE');
                console.error(sessKeysList);
                var encrypt_options = {
                    data: message,
                    sessionKey: {
                        data: sessKeysList[0].data,
                        algorithm: sessKeysList[0].algorithm
                    }
                };
            }).catch(error=>{
                console.error(error);
            });
        });
       
    });

}

// test();
console.error('test complete');
browser.storage.local.clear();

const decryptBtnEnable = "decrypt-button-enabled";
const encryptEnabled = "encrypt-button-enabled";
const tweet_btn = document.querySelector('#global-new-tweet-button');

var current_user = (callback) => {
    var name = document.querySelector('.name');
    if (name) {
        name = name.firstChild.innerText;
        browser.storage.local.set({ current_user: name });
    }
    console.error(name);
    callback(name);
};

var get_passphrase = (msg) => {
    return new Promise((resolve, reject) => {
        var passphrase = prompt(msg + "Please enter your passphrase:");
        if (passphrase === null || passphrase === "") {
            reject('passphrase cancled');
        } else {
            resolve(passphrase);
        }
    });
};


var decrypt = (message, author, cb) => {
    var name = document.querySelector('.name');
    if (!name) {
        alert('You must loggin to decrypt a message');
        return cb(message);
    }
    name = name.firstChild.innerText;
    browser.storage.sync.get({ users: {} }).then(items => {
        var users = items.users;
        if (!users[name]) {
            alert('You must first register through the options page');
            return cb(message);
        }
        // CHECK GROUP MEMBER
        if (!users[author].group[name]) {
            alert(`You are not in ${author}'s secure group`);
            return cb(message);
        }

        var passphrase = prompt("Please enter your passphrase:");
        if (passphrase === null || passphrase === "") {
            alert('encryption cancled');
            return cb(message);
        }
        var privKey = openpgp.key.readArmored(users[name].privateKey).keys[0];
        privKey.decrypt(passphrase).catch(error => {
            alert(error);
            return cb(message);
        });
        // convert session key
        var saved_sessKey = users[author].group[name];
        var to_list = [];
        for (let i = 0; i <= 270; i++) {
            to_list.push(saved_sessKey[i]);
        }
        console.log(to_list);
        var packs = new openpgp.packet.List();
        packs.read(Uint8Array.from(to_list));
        var sessionKeyMessage = new openpgp.message.Message(packs);

        var options = {
            message: sessionKeyMessage,
            privateKeys: privKey,
        };

        // DECRYPT SESSION KEY
        openpgp.decryptSessionKeys(options).then((sessKeysList) => {
            var decrypt_options = {
                message: openpgp.message.readArmored(message),
                sessionKeys: {
                    data: sessKeysList[0].data,
                    algorithm: sessKeysList[0].algorithm
                },
                format: 'utf8'
            };
            // DECRYPT MESSAGE
            openpgp.decrypt(decrypt_options).then((msg) => {
                console.log(msg.data);
                return cb(msg.data);
            });
        });

    });
};

var encrypt = (message, cb) => {
    var name = document.querySelector('.name');
    if (!name) {
        alert('You must loggin to encrypt a message');
        cb(message);
        return message;
    }
    name = name.firstChild.innerText;
    // GET SESSION KEY
    //return new Promise((resolve, reject)=>{
    browser.storage.sync.get({ users: {} }, items => {
        console.error('1');
        var users = items.users;
        if (!users[name]) {
            alert('You must first register through the options page');
            cb(message);
            return message;
        }

        var passphrase = prompt("Please enter your passphrase:");
        if (passphrase === null || passphrase === "") {
            alert('encryption cancled');
            cb(message);
            return message;
        }
        var privKey = openpgp.key.readArmored(users[name].privateKey).keys[0];
        privKey.decrypt(passphrase).catch(error => {
            alert(error);
            cb(message);
            return message;
        });
        console.error('key decrypted');
        // convert session key
        var saved_sessKey = users[name].sessionKey;
        var to_list = [];
        console.log(saved_sessKey);
        for (let i = 0; i <= 270; i++) {
            to_list.push(saved_sessKey[i]);
        }
        console.log(to_list);
        var packs = new openpgp.packet.List();
        packs.read(Uint8Array.from(to_list));
        var sessionKeyMessage = new openpgp.message.Message(packs);

        var options = {
            message: sessionKeyMessage,
            privateKeys: privKey,
        };
        console.error('DECRYPT SESSION KEY');
        // DECRYPT SESSION KEY
        console.error(options);
        openpgp.decryptSessionKeys(options).then((sessKeysList) => {
            console.error('ENCRYPT MESSAGE');
            console.error(sessKeysList);
            var encrypt_options = {
                data: message,
                sessionKey: {
                    data: sessKeysList[0].data,
                    algorithm: sessKeysList[0].algorithm
                }
            };
            // ENCRYPT MESSAGE
            openpgp.encrypt(encrypt_options).then((msg) => {
                console.log(msg.data);
                cb(msg.data);
            });
        });
    }).catch(error => {
        cb(message);
    });
};

var decryptText = (btn) => {
    //    alert("Button clicked " + btn.id);
    //get text by btn
    var tweet = document.querySelector('#tweet-' + btn.id);
    var text = tweet.querySelector('.js-tweet-text');
    var author = tweet.querySelector('.username').innerText;
    console.error(text.innerText);
    console.log(author);
    decrypt(text.innerText, author, (msg)=>{
        text.innerText = msg;
    });
};

var encryptText = async (btn) => {
    console.error('CLICKED');
    var tweet_box = document.querySelector(".is-tweet-box-focus");
    var text = tweet_box.querySelector('.tweet-box');
    console.error(text.innerText);
    encrypt(text.innerText, (msg)=>{
        console.error('RETURNED');
        console.log(msg);

        text.innerText = msg;
    });
    
};

var addDecryptButton = () => {
    var tweets = document.getElementsByClassName("tweet");

    for (var i = 0; i < tweets.length; i++) {
        //var texts = tweets[i].getElementsByClassName("js-tweet-text");
        var buttons = tweets[i].querySelector(".ProfileTweet-actionList");
        if (buttons && !buttons.classList.contains(decryptBtnEnable)) {
            var d_btn = buttons.children[0].cloneNode(true);
            var btn = d_btn.children[0];
            btn.classList.remove("js-actionReply");
            btn.removeAttribute("data-modal");
            btn.removeAttribute("aria-describedby");
            btn.id = "de" + i;
            tweets[i].id = "tweet-" + btn.id;
            btn.title = "decrypt";
            btn.onclick = function () { decryptText(this); };
            btn.children[1].remove();
            var icon = btn.querySelector(".Icon");
            icon.classList.remove("Icon--reply");
            icon.classList.add("Icon--protected");
            buttons.appendChild(d_btn);
            buttons.classList.add(decryptBtnEnable);
        }
    }
};

var addEncryptButton = () => {
    var tweet_box = document.querySelector(".is-tweet-box-focus")
    //var button_box = document.querySelector('#Tweetstorm-tweet-box-0 > div:nth-child(2) > div:nth-child(2)');
    var btn_bx = tweet_box.querySelector('.TweetBoxExtras');
    if (btn_bx.classList.contains(encryptEnabled)) {
        return;
    }
    var decrypt_btn = btn_bx.children[0].cloneNode(true);
    var rubbish = decrypt_btn.querySelector('.image-selector');
    rubbish.remove();
    var btn = decrypt_btn.querySelector('.btn');
    btn.onclick = function () { encryptText(this); };
    btn.title = "Encrypt message";
    btn.id = "encrypt";
    var icon = btn.querySelector('.Icon');
    icon.classList.remove('Icon--media');
    icon.classList.add('Icon--protected');
    console.error(decrypt_btn);
    btn_bx.classList.add(encryptEnabled);
    tweet_box.id = "tweet-" + btn.id;
    btn_bx.appendChild(decrypt_btn);
};

addDecryptButton();

document.body.addEventListener('click', (e) => {
    // console.error(e.target);
    if (e.target == tweet_btn) {
        setTimeout(function () { addEncryptButton(); }, 750);
    } else if (e.target.classList.contains("tweet")) {
        setTimeout(function () { addDecryptButton(); }, 800);
    } else if (e.target.value === "Log in") {
        current_user();
    }
});

current_user();
console.log("DONE");
