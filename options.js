console.log('INIT');

var test = () => {
    browser.storage.sync.set({ test: '123' }).then(() => {
        browser.storage.sync.get('test').then(items => {
            console.log(items);
        });
    });
};

test();



const SESSKEY_SIZE = 16;
const SESSKEY_ALGO = 'aes128';
var USER = undefined;

var display_user_group = () => {
    var group_div = document.querySelector('.sec-group');
    group_div.innerHTML = '';
    console.log(group_div);
    browser.storage.sync.get({ users: {} }).then((items) => {
        var users = items.users;
        if (users[USER]) {
            Object.keys(users[USER].group).forEach(function (key, index) {
                var group_member = document.createElement('li');
                group_member.innerText = key;
                group_div.appendChild(group_member);
            });
        }
    });
};

var gen_sess_key = () => {
    var byteArray = new Uint8Array(SESSKEY_SIZE);
    window.crypto.getRandomValues(byteArray);
    return byteArray;
};

var key_gen = async () => {
    console.log("KEY GEN");
    if (!USER) {
        alert('Log into twitter first!');
        return;
    }

    var passphrase = document.querySelector('#passphrase').value;
    console.log(USER);
    if (passphrase) {
        console.log(passphrase);
        // gen new keys
        var options = {
            userIds: [{ username: USER }],
            numBits: 2048,
            passphrase: passphrase
        };
        const sessKey = gen_sess_key();
        openpgp.generateKey(options).then((keys) => {
            const lockedPrivateKey = keys.privateKeyArmored;
            const publicKey = keys.publicKeyArmored;
            var opts = {
                data: sessKey,
                algorithm: SESSKEY_ALGO,
                publicKeys: openpgp.key.readArmored(publicKey).keys
            };
            console.log('keys generated');
            openpgp.encryptSessionKey(opts).then((lockedSessKey) => {
                // SAVE KEYS
                var keyObj = {
                    username: USER,
                    privateKey: lockedPrivateKey,
                    publicKey: publicKey,
                    sessionKey: lockedSessKey.message.packets.write(),
                    group: {
                        [USER]: lockedSessKey.message.packets.write()
                    }
                };
                console.log('sesskey generated');
                browser.storage.sync.get({ users: {} }).then((items) => {
                    var users = items.users;
                    users[USER] = keyObj;
                    console.log('saving user');
                    browser.storage.sync.set({ users: users }, login());
                }).catch(error => {
                    console.log(error);
                });

            });
        });
    } else {
        alert('No passphrase entered');
    }
};

var add_to_group = () => {
    var add_user = document.querySelector('#member-username').value;
    if (!add_user) {
        return alert('No username entered');
    }
    browser.storage.sync.get({ users: {} }).then(items => {
        var users = items.users;
        var member = users[add_user];
        if (!member) {
            return alert(`${add_user} is not registered with the extension`);
        } else {
            // gen sess key for group member
            var cur_user = items.users[USER];
            console.log(cur_user);
            var passphrase = prompt("Please enter your passphrase to add user:");
            if (passphrase === null || passphrase === "") {
                return 'adding user cancled';
            }
            var privKey = openpgp.key.readArmored(cur_user.privateKey).keys[0];
            privKey.decrypt(passphrase);

            // convert session key
            var saved_sessKey = cur_user.sessionKey;
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


            openpgp.decryptSessionKeys(options).then((sessKeysList) => {
                var encrypt_options = {
                    data: sessKeysList[0].data,
                    algorithm: sessKeysList[0].algorithm,
                    publicKeys: openpgp.key.readArmored(member.publicKey).keys
                };
                openpgp.encryptSessionKey(encrypt_options).then((enryptedSessKey) => {
                    users[USER].group[add_user] = enryptedSessKey.message.packets.write();
                    // SAVE NEW GROUP MEMBER
                    browser.storage.sync.set({ users: users }).then(() => {
                        display_user_group();
                    });
                });
            });
        }
    });
    return false;
};

var remove_from_group = () => {
    var rm_user = document.querySelector('#member-username').value;
    if (!rm_user) {
        return alert('No username entered');
    }
    browser.storage.sync.get({ users: {} }).then(items => {
        var users = items.users;
        delete users[USER].group[rm_user];
        browser.storage.sync.set({ users: users }).then(() => {
            display_user_group();
        });
    });
};

var login = () => {
    console.log('login');
    var signups = document.querySelectorAll('.signup');
    signups.forEach((elem) => {
        elem.style.display = "none";
    });
    var loggedin = document.querySelectorAll('.loggedin');
    loggedin.forEach((elem) => {
        elem.style.display = "inline";
    });
    var login_msg = document.querySelector('.login');
    console.log(login_msg);
    login_msg.innerText = `${USER} logged in`;
    display_user_group()
    // TODO display user group
};

var signup = (error) => {
    console.log('signup');
    var signup_msg = document.querySelector('.twttr-login');
    signup_msg.innerText = `You will be registered as ${USER} `;
};

var try_login = (username) => {
    console.log(username);
    browser.storage.sync.get({ users: {} }).then(items => {
        console.log(items.users);
        if (items.users[username]) {
            login(username);
        } else {
            signup(undefined);
        }
    }).catch(error => {
        console.log(error);
    });
};

var check_user_loggedin = () => {
    browser.storage.local.get({ current_user: undefined }).then(items => {
        console.log(items);
        if (items.current_user) {
            USER = items.current_user;
            try_login(items.current_user);
        }
    })
};

var storage_change = (changes, area) => {
    console.log('Changes called');
    if (area == 'local') {
        console.error(changes);
        var changed_items = Object.keys(changes);
        for (var item of changed_items) {
            if (item == 'current_user') {
                USER = changes[item].newValue;
                try_login(changes[item].newValue);
                //CURRENT_USER = changes[item].newValue;
            }
        }
    }
};

check_user_loggedin();
browser.storage.onChanged.addListener(storage_change);
document.querySelector('#key-gen').addEventListener('click', () => { key_gen(); });
document.querySelector('#group_add').addEventListener('click', () => { add_to_group(); });
document.querySelector('#group_rm').addEventListener('click', () => { remove_from_group(); });
