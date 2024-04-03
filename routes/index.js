var express = require('express');
var router = express.Router();
const userModel = require("./users")
const productModel = require("./product");
const cartModel = require("./cart");
const wishlistModel = require("./wishlist")
const localStrategy = require("passport-local");
const passport = require('passport');
const upload = require('./multer')
passport.use(new localStrategy(userModel.authenticate()))

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  res.render('profile', { title: 'Express', user });
});

router.post('/uploadProfileImage', upload.single('image') , isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  user.picture = req.file.filename
  await user.save();
  res.render('profile', { title: 'Express', user });
});

router.get('/cart', isLoggedIn, async (req, res) => {
  const cart = await cartModel.findOne({ user: req.params.userId }).populate('items.productId');
  res.render('cart', { cart });
});

router.get('/wishlist', async (req, res) => {
  const wishlist = await wishlistModel.findOne({ user: req.params.userId }).populate('items.productId');
  res.render('wishlist', { wishlist });
});

router.post('/remove-from-cart', async (req, res) => {
  const productId = req.body.productId;
  const userId = req.session.userId;
  const cart = await cartModel.findOne({ userId });

  if (cart) {
    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    await cart.save();
  }

  res.redirect('/cart');
});

router.get('/sell', function (req, res, next) {
  res.render('sell', { title: 'Express' });
});

router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Express' });
});

router.post('/register', function (req, res, next) {
  var user = new userModel({
    username: req.body.username,
    contact: req.body.contact,
    email: req.body.email,
    type: req.body.type
  });

  userModel.register(user, req.body.password).then(function (registeredUser) {
    passport.authenticate("local")(req, res, function () {
      res.redirect('/home')
    })
  })
})

router.get('/home', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  const products = await productModel.find()
  res.render('home', { title: 'Express', user, products });
});

router.post('/add-to-cart', isLoggedIn, async (req, res) => {
  const productId = req.body.productId;
  const user = await userModel.findOne({ _id: req.user._id });
  console.log(user)

  let cart = await cartModel.findOne({ userId: user._id });

  console.log(cart)

  cart = new cartModel({
    userId: user._id,
    items: []
  });

  cart.items.push({ productId });
  await cart.save();
  res.redirect('back');
});

router.post('/add-to-wishlist', async (req, res) => {
  const productId = req.body.productId;
  const user = await userModel.findOne({ _id: req.user._id });
  let wishlist = await wishlistModel.findOne({ userId: user });

  wishlist = new wishlistModel({
    userId: user,
    items: []
  });

  wishlist.items.push({ productId });
  await wishlist.save();
  res.redirect('/home');
});

router.post('/upload', upload.single('image'), async (req, res) => {
  const Product = new productModel({
    productName: req.body.productName,
    description: req.body.description,
    price: req.body.price,
    image: req.file.filename
  });

  const savedProduct = await Product.save();

  res.redirect('/home');
});

router.post('/login', passport.authenticate("local", {
  successRedirect: "/home",
  failureRedirect: "/login",
}), function (req, res) { });

router.get('/logout', function (req, res, next) {
  req.logOut(function (err) {
    if (err) { return next(err); }
    res.redirect('/')
  })
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/')
}

module.exports = router;