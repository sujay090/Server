import mongoose from 'mongoose';

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log('MongoDB Connected');
		mongoose.set('debug', (coll, method, query, doc) => {
			console.log(`Mongoose: ${coll}.${method}`, JSON.stringify(query), doc);
		});
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
};

export default connectDB;
