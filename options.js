const SESSKEY_SIZE = 16;
const SESSKEY_ALGO = 'aes128';
var USER = undefined;

/** 
 * Rerenders the users in the secure group
 */
var display_user_group = () => {
    var group_div = document.querySelector('.sec-group');
    group_div.innerHTML = ''; // empty dic
    console.log(group_div);
    browser.storage.sync.get({ users: {} }).then((items) => {
        var users = items.users;
        if (users[USER]) {
            // add sercure group mebmers
            Object.keys(users[USER].group).forEach(function (user, index) {
                var group_member = document.createElement('li');
                group_member.innerText = user;
                group_div.appendChild(group_member);
            });
        }
    });
};

// generate a new session key
var gen_sess_key = () => {
    var byteArray = new Uint8Array(SESSKEY_SIZE);
    window.crypto.getRandomValues(byteArray);
    return byteArray;
};

// generate new keys for a user and save them
var key_gen = async () => {
    if (!USER) {
        alert('Log into twitter first!');
        return;
    }

    var passphrase = document.querySelector('#passphrase').value;
    if (passphrase) {
        // openpgp key gen options
        var options = {
            userIds: [{ username: USER }],
            numBits: 2048,
            passphrase: passphrase
        };
        const sessKey = gen_sess_key();
        // generate RSA key pair
        openpgp.generateKey(options).then((keys) => {
            const lockedPrivateKey = keys.privateKeyArmored;
            const publicKey = keys.publicKeyArmored;
            // encrypt session key with public key
            var opts = {
                data: sessKey,
                algorithm: SESSKEY_ALGO,
                publicKeys: openpgp.key.readArmored(publicKey).keys
            };
            openpgp.encryptSessionKey(opts).then((lockedSessKey) => {
                var keyObj = {
                    username: USER,
                    privateKey: lockedPrivateKey,
                    publicKey: publicKey,
                    // sessionKey saved as byte array
                    sessionKey: lockedSessKey.message.packets.write(),
                    group: {
                        [USER]: lockedSessKey.message.packets.write()
                    }
                };
                // GET users sofar
                browser.storage.sync.get({ users: {} }).then((items) => {
                    var users = items.users;
                    // add new user
                    users[USER] = keyObj;
                    console.log('saving user');
                    // SAVE updated user list + login new user
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

/**
 * Add a new user to the group
 */
var add_to_group = () => {
    var add_user = document.querySelector('#member-username').value;
    if (!add_user) {
        return alert('No username entered');
    }
    browser.storage.sync.get({ users: {} }).then(items => {
        var users = items.users;
        var member = users[add_user];
        if (!member) { // CHECK valid member
            return alert(`${add_user} is not registered with the extension`);
        } else {
            // GET session key from current user
            var cur_user = items.users[USER];
            console.log(cur_user);
            var passphrase = prompt("Please enter your passphrase to add user:");
            if (passphrase === null || passphrase === "") {
                return 'adding user cancled';
            }
            var privKey = openpgp.key.readArmored(cur_user.privateKey).keys[0];
            privKey.decrypt(passphrase);

            // convert session key to openpgp message obj
            var saved_sessKey = cur_user.sessionKey;
            var to_list = [];
            for (let i = 0; i <= 270; i++) {
                to_list.push(saved_sessKey[i]);
            }
            var packs = new openpgp.packet.List();
            packs.read(Uint8Array.from(to_list));
            var sessionKeyMessage = new openpgp.message.Message(packs);

            // decrypt session Key
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
                // ENCRYPT session Key with member publicKey
                openpgp.encryptSessionKey(encrypt_options).then((enryptedSessKey) => {
                    users[USER].group[add_user] = enryptedSessKey.message.packets.write();
                    // SAVE NEW GROUP MEMBER
                    browser.storage.sync.set({ users: users }).then(() => {
                        // update displayed group
                        display_user_group();
                    });
                });
            });
        }
    });
};

/**
 * Remove a user from the secret group
 */
var remove_from_group = () => {
    var rm_user = document.querySelector('#member-username').value;
    if (!rm_user) {
        return alert('No username entered');
    }
    browser.storage.sync.get({ users: {} }).then(items => {
        var users = items.users;
        delete users[USER].group[rm_user];
        // Update saved users list
        browser.storage.sync.set({ users: users }).then(() => {
            // update displayed group
            display_user_group();
        });
    });
};

/**
 * Log the current user in 
 * display their details
 */
var login = () => {
    // remove the signup elements
    var signups = document.querySelectorAll('.signup');
    signups.forEach((elem) => {
        elem.style.display = "none";
    });
    // display loggenin data
    var loggedin = document.querySelectorAll('.loggedin');
    loggedin.forEach((elem) => {
        elem.style.display = "inline";
    });
    var login_msg = document.querySelector('.login');
    console.log(login_msg);
    login_msg.innerText = `Hello, ${USER}`;
    display_user_group()
};

/**
 * Promp user to signup
 * 
 */
var signup = (error) => {
    console.log('signup');
    var signup_msg = document.querySelector('.twttr-login');
    signup_msg.innerText = `You will be registered as ${USER} `;
};

/**
 * If registered log the user in, else prompt to signup
 * @param username of user
 */
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

/**
 * Check if user is logged in on twitter, try to log them in
 */
var check_user_loggedin = () => {
    browser.storage.local.get({ current_user: undefined }).then(items => {
        console.log(items);
        if (items.current_user) {
            USER = items.current_user;
            try_login(items.current_user);
        }
    })
};

/**
 * If new current_user is saved -> try to leg them in
 * @param {*} changes the changes made to the storage
 * @param {*} area the area the changes happend in
 */
var storage_change = (changes, area) => {
    console.log('Changes called');
    if (area == 'local') {
        console.error(changes);
        var changed_items = Object.keys(changes);
        for (var item of changed_items) {
            if (item == 'current_user') {
                USER = changes[item].newValue;
                try_login(changes[item].newValue);
            }
        }
    }
};

check_user_loggedin();
browser.storage.onChanged.addListener(storage_change);
document.querySelector('#key-gen').addEventListener('click', () => { key_gen(); });
document.querySelector('#group_add').addEventListener('click', () => { add_to_group(); });
document.querySelector('#group_rm').addEventListener('click', () => { remove_from_group(); });
