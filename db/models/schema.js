/*const mongoose=require('mongoose');

let UserSchema=new mongoose.Schema({
    u_id:{
        type:String,
        unique:true,
        required:'uid field is required'
    },
    u_fname:{
        type:String,
        required:'u_fname field is required'
    },
    u_lname:{
        type:String,
        required:'u_lname field is required'
    },
    u_email:{
        type:String,
        required:'u_email field is required'
    },
    u_designation:{
        type:String,
        required:'u_designation field is required'
    },
    u_password:{
        type:String,
        required:'u_password field is required'
    },
    u_status:{
        type:String,
        required:'u_status field is required'  
    } 

});

let ProjectSchema=new mongoose.Schema({
    p_id:{
        type:String,
        unique:true,
        required:'p_id field is required'
    },
    p_name:{
        type:String,
        required:'p_name field is required'
    },
    p_Manager_id:{
        type:String,
        required:'p_Manager_id field is required'
    },

});

let Projectmapping=new mongoose.Schema({
    u_id:{
        type:String,
        required:'u_id field is required'
    },
    p_id:{
        type:String,
        required:'p_id field is required'
    },
    p_Manager_id:{
        type:String,
        required:'p_Manager_id field is required'
    },

});

let FilesMgrSchema=new mongoose.Schema({
    f_id:{
        type:String,
        unique:true,
        required:'f_id field is required'
    },
    f_name:{
        type:String,
        required:'f_name field is required'
    },
    p_id:{
        type:String,
        required:'p_id field is required'
    },

});

let ProjectApprovalSchema=new mongoose.Schema({
    u_id:{
        type:String,
        required:'u_id field is required'
    },
    p_id:{
        type:String,
        required:'p_id field is required'
    },
    p_status:{
        type:String,
        required:'p_status field is required'
    },

});
mongoose.model('users',UserSchema);
mongoose.model('projects',ProjectSchema);
mongoose.model('pmapping',Projectmapping);
mongoose.model('files',FilesMgrSchema);
mongoose.model('approval',ProjectApprovalSchema);*/