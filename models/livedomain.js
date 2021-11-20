const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//live Domain data schema
let liveDomainSchema=new Schema({
  url:{
    type:String
  },
  curstatus:{
    type:String
  },
  prestatus:{
    type:String
  },
  timestamp:{
    type:Date,
    default:Date.now
  }
});

let LiveDomain = module.exports = mongoose.model('LiveDomain',liveDomainSchema);
