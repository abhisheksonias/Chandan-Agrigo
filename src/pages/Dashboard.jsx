import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Users, Package, Truck, BarChart3, History, LineChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const dashboardItems = [
	{ title: 'Add Order', icon: ShoppingCart, path: '/add-order', description: 'Create new customer orders' },
	{ title: 'Add Customer', icon: Users, path: '/customers', description: 'Manage customer information' },
	{ title: 'Add Product', icon: Package, path: '/products', description: 'Manage product inventory' },
	{ title: 'Add Transport', icon: Truck, path: '/transports', description: 'Manage transport providers' },
	{ title: 'Analytics Board', icon: BarChart3, path: '/analytics', description: 'View sales and order analytics' },
	{ title: 'Sales Analytics', icon: LineChart, path: '/sales-analytics', description: 'Visual charts and reports for sales data' },
	{ title: 'Past Orders', icon: History, path: '/past-orders', description: 'View fully dispatched past orders' },
];

const Dashboard = () => {
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20, scale: 0.95 },
		visible: {
			opacity: 1,
			y: 0,
			scale: 1,
			transition: {
				type: 'spring',
				stiffness: 260,
				damping: 20,
			},
		},
	};

	return (
		<div className="space-y-8">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="flex flex-col items-center text-center p-6 rounded-xl bg-gradient-to-br from-primary to-blue-400 text-white shadow-lg"
			>
				<div className='bg-[#fff8ef] rounded-2xl px-3 pt-2'>
				<img src="/CAPL_Logo.png" alt="Chandan Agrico Logo" className="h-16 w-16 mb-4 object-contain" />
				</div>
				<h1 className="text-4xl font-bold tracking-tight">Welcome to Chandan Agrico</h1>
				<p className="text-lg mt-2 max-w-2xl">
					Your central hub for managing orders, customers, products, and transport for your agriculture business.
				</p>
			</motion.div>

			<motion.div
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				{dashboardItems.map((item) => (
					<motion.div key={item.title} variants={itemVariants}>
						<Link to={item.path}>
							<Card className="h-full hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1 glass-card border-primary/20">
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
									<div className="p-3 rounded-full bg-primary/10 text-primary">
										<item.icon className="h-6 w-6" />
									</div>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-sm text-muted-foreground">
										{item.description}
									</CardDescription>
								</CardContent>
							</Card>
						</Link>
					</motion.div>
				))}
			</motion.div>
		</div>
	);
};

export default Dashboard;