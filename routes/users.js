const mongoose = require('mongoose')
const plm = require("passport-local-mongoose")

mongoose.connect("mongodb://127.0.0.1:27017/E-commerce")

const userSchema = mongoose.Schema({
  username: String,
  password: String,
  email: String,
  contact: Number,
  type: {
    type: String,
    enum: ['buyer', 'seller'],
    default: 'buyer'
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cart' 
}
},{ timestamps: true })

userSchema.plugin(plm)

module.exports = mongoose.model("user", userSchema)