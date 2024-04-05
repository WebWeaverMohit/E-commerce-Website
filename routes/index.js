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

// Route to render the My Uploads page
router.get('/myUploads', isLoggedIn, async function (req, res, next) {
  try {
    const userId = req.user._id;
    const uploadedProducts = await productModel.find({ seller: userId });

    console.log(uploadedProducts); // Check if products are fetched correctly

    res.render('myUploads', { title: 'My Uploads', uploadedProducts, userId });
  } catch (err) {
    console.error(err);
    next(err);
  }
});



router.get('/buyItem/:productId', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  const product = await productModel.findOne({ _id: req.params.productId })
  res.render('buyItem', { title: 'Express', user, product });
});

router.get('/profile', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  res.render('profile', { title: 'Express', user });
});

router.post('/uploadProfileImage', upload.single('image'), isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  user.picture = req.file.filename
  await user.save();
  res.render('profile', { title: 'Express', user });
});

router.get('/cart', isLoggedIn, async (req, res) => {
  const cart = await cartModel.findOne({ user: req.params.userId }).populate('items.productId');
  res.render('cart', { cart });
});

router.get('/wishlist',isLoggedIn , async (req, res) => {
  // const user = req.params.user; 
  const wishlist = await wishlistModel.findOne({ user: req.params.userId }).populate('items.productId');
  // const product = await productModel.findOne({ _id: req.params.productId })
  res.render('wishlist', { wishlist });
});

router.post('/remove-from-wislist', isLoggedIn, async (req, res) => {
  const productId = req.body.productId;
  const user = await userModel.findOne({ _id: req.user._id });
  let wishlist = await wishlistModel.findOne({ userId: user._id }).populate('items')

  const indexToRemove = wishlist.items.findIndex(item => item.productId.toString() === productId);

  if (indexToRemove !== -1) {
    wishlist.items.splice(indexToRemove, 1);
  }

  await wishlist.save();
  res.redirect('/wishlist');
});

router.post('/remove-from-cart', isLoggedIn, async (req, res) => {
  const productId = req.body.productId;
  const user = await userModel.findOne({ _id: req.user._id });
  let cart = await cartModel.findOne({ userId: user._id }).populate('items')

  const indexToRemove = cart.items.findIndex(item => item.productId.toString() === productId);

  if (indexToRemove !== -1) {
    cart.items.splice(indexToRemove, 1);
  }

  await cart.save();
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
  const quantity = parseInt(req.body.quantity);
  const user = await userModel.findOne({ _id: req.user._id });
  let cart = await cartModel.findOne({ userId: user._id });

  console.log(cart)

  if (!cart) {
    cart = new cartModel({
      userId: user._id,
      items: []
    });
  }

  const existingItem = cart.items.find(item => item.productId.toString() === productId);

if (existingItem) {
    existingItem.quantity++; // Increase quantity by one
} else {
    // If item does not exist, add new item to cart
    cart.items.push({ productId, quantity: 1 }); // Assuming initial quantity is 1
}

  await cart.save();
  res.redirect('back');
});

router.post('/add-to-wishlist', async (req, res) => {
  const productId = req.body.productId;
  const user = await userModel.findOne({ _id: req.user._id });
  let wishlist = await wishlistModel.findOne({ userId: user });

  if (!wishlist) {
    wishlist = new wishlistModel({
      userId: user,
      items: []
    });
  }

  const isProductInWishlist = wishlist.items.find(product => productId.toString() === productId);

  if (!isProductInWishlist) {
    wishlist.items.push(productId);
  }
  await wishlist.save();
  res.redirect('back');
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
    res.redirect('/login')
  })
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect('/')
}

module.exports = router;