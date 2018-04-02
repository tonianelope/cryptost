// Clear local storage (saves current_user)
browser.storage.local.clear();

const decryptBtnEnable = "decrypt-button-enabled";
const encryptEnabled = "encrypt-button-enabled";
const tweet_btn = document.querySelector('#global-new-tweet-button');

/**
 * if user is logged in -> set current_user in local storage
 */
var current_user = (callback) => {
    var name = document.querySelector('.name');
    if (name) {
        name = name.firstChild.innerText;
        browser.storage.local.set({ current_user: name });
    }
    console.error(name);
    callback(name);
};

/**
 * Decrypts the message by author if currect_user is in the secure group
 * @param {*} message to decrypt
 * @param {*} author who posted the message
 * @param {*} cb return call
 */
var decrypt = (message, author, cb) => {
    // GET loggedin username
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
        // CHECK user is GROUP MEMBER
        if (!users[author].group[name]) {
            alert(`You are not in ${author}'s secure group`);
            return cb(message);
        }

        // GET passphase to decrypt private key
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

/**
 * Encrypt message with users session key
 * @param message 
 * @param cb 
 */
var encrypt = (message, cb) => {
    // GET logged in user
    var name = document.querySelector('.name');
    if (!name) {
        alert('You must loggin to encrypt a message');
        cb(message);
        return message;
    }
    name = name.firstChild.innerText;
    browser.storage.sync.get({ users: {} }, items => {
        console.error('1');
        var users = items.users;
        if (!users[name]) {
            alert('You must first register through the options page');
            cb(message);
            return message;
        }
        // GET passphrase to decrypt private key
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
        // convert session key
        var saved_sessKey = users[name].sessionKey;
        var to_list = [];
        for (let i = 0; i <= 270; i++) {
            to_list.push(saved_sessKey[i]);
        }
        var packs = new openpgp.packet.List();
        packs.read(Uint8Array.from(to_list));
        var sessionKeyMessage = new openpgp.message.Message(packs);

        var options = {
            message: sessionKeyMessage,
            privateKeys: privKey,
        };
        // DECRYPT SESSION KEY with private key
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

/**
 * Get the text to decrypt, decrypt it and display it
 * @param {*} btn button clicked
 */
var decryptText = (btn) => {
    var tweet = document.querySelector('#tweet-' + btn.id);
    var text = tweet.querySelector('.js-tweet-text');
    var author = tweet.querySelector('.username').innerText;
    decrypt(text.innerText, author, (msg)=>{
        text.innerText = msg;
    });
};

/**
 * Get the text to encrypt, encrypted it and replace it
 * @param  btn button clicked
 */
var encryptText = async (btn) => {
    var tweet_box = document.querySelector(".is-tweet-box-focus");
    var text = tweet_box.querySelector('.tweet-box');
    encrypt(text.innerText, (msg)=>{
        text.innerText = msg;
    });
    
};

/**
 * Add a decrypt button to all posts
 */
var addDecryptButton = () => {
    var tweets = document.getElementsByClassName("tweet");

    for (var i = 0; i < tweets.length; i++) {
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
            // call decrypt function if button is clicked
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

/**
 * Add encrypt button to tweet box
 */
var addEncryptButton = () => {
    var tweet_box = document.querySelector(".is-tweet-box-focus")
    var btn_bx = tweet_box.querySelector('.TweetBoxExtras');
    if (btn_bx.classList.contains(encryptEnabled)) {
        return;
    }
    var decrypt_btn = btn_bx.children[0].cloneNode(true);
    var rubbish = decrypt_btn.querySelector('.image-selector');
    rubbish.remove();
    var btn = decrypt_btn.querySelector('.btn');
    // on click encrypt text
    btn.onclick = function () { encryptText(this); };
    btn.title = "Encrypt message";
    btn.id = "encrypt";
    var icon = btn.querySelector('.Icon');
    icon.classList.remove('Icon--media');
    icon.classList.add('Icon--protected');
    btn_bx.classList.add(encryptEnabled);
    tweet_box.id = "tweet-" + btn.id;
    btn_bx.appendChild(decrypt_btn);
};

/**
 * Add event listener 
 */
document.body.addEventListener('click', (e) => {
    // console.error(e.target);
    if (e.target == tweet_btn) {
        // add encrypt button when tweet button is clicked
        setTimeout(function () { addEncryptButton(); }, 750);
    } else if (e.target.classList.contains("tweet")) {
        // add decrypt button if someone clicks into a tweet
        setTimeout(function () { addDecryptButton(); }, 800);
    } else if (e.target.value === "Log in") {
        // set current_user if someone logs in
        current_user();
    }
});

addDecryptButton();
current_user();
