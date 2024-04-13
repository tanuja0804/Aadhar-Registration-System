const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const Aadhaar = require('../models/Aadhaar'); // Importing Aadhaar model
const User = require('../models/user'); // Import User model
const upload = multer();

// Hashing salt rounds
const saltRounds = 10;

// Function to generate a unique 7-digit ID
async function generateUniqueID() {
    let uniqueID;
    let exists;
    do {
        uniqueID = Math.floor(Math.random() * 9000000) + 1000000;
        exists = await Aadhaar.exists({ unique_id: uniqueID });
    } while (exists);
    return uniqueID;
}

// Aadhaar application form route
router.post('/apply-for-aadhaar', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'signature', maxCount: 1 }]), async (req, res) => {
    try {
        const {
            firstName, lastName, gender, dob, address,
            email, contact, fatherName, motherName,
            password
        } = req.body;

        // Get photo and signature from request files
        const photo = req.files['photo'] ? req.files['photo'][0].buffer : null;
        const signature = req.files['signature'] ? req.files['signature'][0].buffer : null;

        // Generate a unique 7-digit ID
        const uniqueID = await generateUniqueID();

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new Aadhaar application document
        const aadhaarApp = new Aadhaar({
            unique_id: uniqueID,
            firstName,
            lastName,
            gender,
            dob,
            address,
            email,
            contact,
            fatherName,
            motherName,
            photo,
            signature,
            password: hashedPassword,
        });

        // Save the Aadhaar application to the database
        await aadhaarApp.save();

        res.send({ "Success": "Aadhaar application submitted successfully!" });
    } catch (error) {
        console.error('Error handling Aadhaar application:', error);
        res.status(500).send('Server error');
    }
});


router.get('/', function (req, res, next) {
	return res.render('index.ejs');
});


router.post('/', function(req, res, next) {
	console.log(req.body);
	var personInfo = req.body;


	if(!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf){
		res.send();
	} else {
		if (personInfo.password == personInfo.passwordConf) {

			User.findOne({email:personInfo.email},function(err,data){
				if(!data){
					var c;
					User.findOne({},function(err,data){

						if (data) {
							console.log("if");
							c = data.unique_id + 1;
						}else{
							c=1;
						}

						var newPerson = new User({
							unique_id:c,
							email:personInfo.email,
							username: personInfo.username,
							password: personInfo.password,
							passwordConf: personInfo.passwordConf
						});

						newPerson.save(function(err, Person){
							if(err)
								console.log(err);
							else
								console.log('Success');
						});

					}).sort({_id: -1}).limit(1);
					res.send({"Success":"You are regestered,You can login now."});
				}else{
					res.send({"Success":"Email is already used."});
				}

			});
		}else{
			res.send({"Success":"password is not matched"});
		}
	}
});

router.get('/login', function (req, res, next) {
	return res.render('login.ejs');
});

router.post('/login', function (req, res, next) {
	//console.log(req.body);
	User.findOne({email:req.body.email},function(err,data){
		if(data){
			
			if(data.password==req.body.password){
				//console.log("Done Login");
				req.session.userId = data.unique_id;
				//console.log(req.session.userId);
				res.send({"Success":"Success!"});
				
			}else{
				res.send({"Success":"Wrong password!"});
			}
		}else{
			res.send({"Success":"This Email Is not regestered!"});
		}
	});
});

router.get('/profile', function (req, res, next) {
    console.log("profile");
    User.findOne({unique_id:req.session.userId}, function(err, data){
        console.log("data");
        console.log(data);
        if (!data) {
            res.redirect('/');
        } else {
            // Render the new EJS template file named 'aadhar.ejs'
            return res.render('aadhar.ejs', {"name": data.username, "email": data.email});
        }
    });
});

router.get('/logout', function (req, res, next) {
	console.log("logout")
	if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
    	if (err) {
    		return next(err);
    	} else {
    		return res.redirect('/');
    	}
    });
}
});

router.get('/forgetpass', function (req, res, next) {
	res.render("forget.ejs");
});

router.post('/forgetpass', function (req, res, next) {
	//console.log('req.body');
	//console.log(req.body);
	User.findOne({email:req.body.email},function(err,data){
		console.log(data);
		if(!data){
			res.send({"Success":"This Email Is not regestered!"});
		}else{
			// res.send({"Success":"Success!"});
			if (req.body.password==req.body.passwordConf) {
			data.password=req.body.password;
			data.passwordConf=req.body.passwordConf;

			data.save(function(err, Person){
				if(err)
					console.log(err);
				else
					console.log('Success');
					res.send({"Success":"Password changed!"});
			});
		}else{
			res.send({"Success":"Password does not matched! Both Password should be same."});
		}
		}
	});
	
});

// Route to render the Aadhar application form
router.get('/apply-for-aadhar', function (req, res, next) {
    res.render('apply_aadhar.ejs');
});

// Route to handle form submission
router.post('/apply-for-aadhar', function (req, res, next) {
    // Process the form submission here
    // Extract data from req.body
    const formData = req.body;
    
    // Validate and save the form data to the database as required
    
    // Send a success response to the user
    res.send({"Success": "Aadhar application submitted successfully!"});
});

module.exports = router;