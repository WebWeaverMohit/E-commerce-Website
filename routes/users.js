const mongoose = require('mongoose')
const plm = require("passport-local-mongoose")

mongoose.connect("mongodb://127.0.0.1:27017/E-commerce")

const userSchema = mongoose.Schema({
  username: String,
  password: String,
  email: String,
  contact: Number,
  picture: {
    type: String,
    default: "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg"
  },
  type: {
    type: String,
    enum: ['buyer', 'seller'],
    default: 'buyer'
  },
  products: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product'
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cart'
  },
  wishlist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'wishlist'
  }
}, { timestamps: true })

userSchema.plugin(plm)

module.exports = mongoose.model("user", userSchema)