// seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const sampleProducts = [
    {
        name: 'Classic White Tee',
        description: 'Udobna pamučna majica.',
        price: 25.99,
        category: 'Clothing',
        image: 'https://via.placeholder.com/300',
        stock: 50
    },
    {
        name: 'Black Hoodie',
        description: 'Topla dukserica sa kapuljačom.',
        price: 45.00,
        category: 'Clothing',
        image: 'https://via.placeholder.com/300',
        stock: 30
    }
    // Dodajte još 2-3 proizvoda ovde
];

const importData = async () => {
    try {
        await Product.deleteMany(); // Čisti bazu pre uvoza
        await Product.insertMany(sampleProducts);
        console.log('Podaci uvezeni!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

importData();