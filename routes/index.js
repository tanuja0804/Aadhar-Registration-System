const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const Aadhaar = require('../models/Aadhaar'); // Importing Aadhaar model
const User = require('../models/user'); // Import User model
const session = require('express-session');
const path = require('path');

path.join(__dirname, 'views'); // Set the views directory path to the views folder in the root of the project
path.join(__dirname,'uploads'); // Set the uploads directory path to the uploads folder in the root of the project

// Set up multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/") // Saves the files to the uploads directory in the root of the project
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + "-" + file.originalname)
	},
})
const upload = multer({ storage: storage })

//accessing multer storage (eg : photo, signature)
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/')
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.originalname + '-' + Date.now() + '.jpg')
//     }
// });

// Hashing salt rounds
const saltRounds = 10;

// Function to generate a unique 9-digit ID
async function generateUniqueID() {
    let uniqueID = Math.floor(100000000 + Math.random() * 900000000); //? first generate a  9-dig no. and then add 1000... to it to ensure it is a 9-dig no. because Math.random() generates a number between 0 and 1
	let aadhaar = await Aadhaar.findOne({ unique_id: uniqueID });
	if (aadhaar) {
		uniqueID = await generateUniqueID();
	}
	return uniqueID;
}



// Aadhaar application form route
router.post('/apply-for-aadhaar', upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'signature', maxCount: 1 }]), async (req, res) => {
    try {
        const {
            firstName, lastName, gender, dob, address,
            email, contactDetails, fathersName, mothersName,password
        } = req.body;

        // Get photo and signature from request files
		const photo = req.files['photo'][0].path;
		const signature = req.files['signature'][0].path;
		//console.log(req.files);

        // Generate a unique 9-digit ID
        const uniqueID = await generateUniqueID();
		//console.log(uniqueID);

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
            contactDetails,
            fathersName,
            mothersName,
            photoURL: photo,
            signatureURL: signature,
            password: hashedPassword,
        });
		console.log(aadhaarApp);

        // // Save the Aadhaar application to the database
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
					res.send({"Success":"You are registered,You can login now."});
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
	const email = req.body.email;
	const password = req.body.password;
	let user = User.findOne({email: email});
	if(!user){
		res.send({"Success":"Email is not registered!"});
	}
	else{
		if(bcrypt.compare(password, user.password)){
			req.session.userId = user.unique_id;
			console.log(req.session.userId);
			res.send({"Success":"Success!"});
		}
		else{
			res.send({"Success":"Password is incorrect!"});
		}
	}

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