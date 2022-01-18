const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AES = require('../middleware/aes-encrypt');
const passwordValidator = require('password-validator');

const passwordSchema = new passwordValidator();
passwordSchema
    .is().min(8)                                    // Minimum 8 caractères
    .is().max(100)                                  // Maximum 100 caractères
    .has().uppercase()                              // Doit contenir au moins une majuscule
    .has().lowercase()                              // Doit contenir au moins une minuscule
    .has().digits(2)                                // Doit avoir au moins 2 chiffres
    .has().not().spaces()                           // Ne doit pas avoir d'espaces
    .is().not().oneOf(['Passw0rd', 'Password123', 'azerty1234']); // Liste de mots de passes interdits

//Création d'un utilisateur
exports.signup = (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: 'Veuillez remplir tous les champs' });
    }
    if (!passwordSchema.validate(password)) {
        return res.status(400).json({ error: 'Mot de passe incorrect' });
    }
    const cryptedEmail = AES.encrypt(email);
    User.findOne({
        where: {
            email: cryptedEmail
        }
    })
        .then(user => {
            if (user) {
                return res.status(400).json({ error: 'Cet email est déjà utilisé' });
            }
            const salt = bcrypt.genSaltSync(10);
            const hashPassword = bcrypt.hashSync(password, salt);
            User.create({
                firstName: firstName,
                lastName: lastName,
                email: cryptedEmail,
                password: hashPassword,
            })
                .then(() => {
                    res.status(201).json({ message: 'Utilisateur créé avec succès !' });
                })
                .catch(error => {
                    res.status(400).json({ error: 'Une erreur est survenue lors de la création de l\'utilisateur' });
                });
        })
        .catch(error => {
            res.status(500).json({ error: 'Une erreur est survenue lors de la création de l\'utilisateur', message: error.message });
        });
};

//Module de connection

exports.login = (req, res, next) => {
    const cryptedEmail = AES.encrypt(req.body.email);
    User.findOne({ email: cryptedEmail })
      .then(user => {
        if (!user) {
          return res.status(401).json({ error: 'Utilisateur non trouvé !' });
        }
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              return res.status(401).json({ error: 'Mot de passe incorrect !' });
            }
            res.status(200).json({
              userId: user.id,
              token: jwt.sign(
                { userId: user.id }, 
                '${process.env.TOKEN}',
                { expiresIn: '24h' }
              )
            });
          })
          .catch(error => res.status(500).json({ error, message: error.message }));
      })
      .catch(error => res.status(500).json({ error, message: error.message }));
  };

//Modification de l'utilisateur

exports.modifyUser = (req, res, next) => {
    const emailEncrypt = AES.encrypt(req.body.email);
    const userId = req.userId;
    User.findOne({ _id: userId, userId: req.token.userId })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            user.email = emailEncrypt;
            user.save()
                .then(() => res.status(200).json({ message: 'Utilisateur modifié !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error, message: error.message }));
};

//Suppression d'un utilisateur par l'utilisateur ou un admin

exports.deleteUser = (req, res, next) => {
    const userId = req.userId;
    User.findOne({ _id: userId, userId: req.token.userId })
        .then(user => {
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            user.delete()
                .then(() => res.status(200).json({ message: 'Utilisateur supprimé !' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error, message: error.message }));
};

exports.gets = async () => {
    await User.findAll({ raw: true }).then((users) => {
        for (const user of users) {
            console.log(user);
        }
    }).catch((error) => {
        console.log("error : " + error);
    });
};