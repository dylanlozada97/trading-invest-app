CREATE TABLE `app_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`email` varchar(320) NOT NULL,
	`balance` varchar(50) NOT NULL DEFAULT '0',
	`totalReferrals` int NOT NULL DEFAULT 0,
	`referralCode` varchar(64) NOT NULL,
	`referredBy` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_users_username_unique` UNIQUE(`username`),
	CONSTRAINT `app_users_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`refereeId` int NOT NULL,
	`amount` varchar(50) NOT NULL,
	`percentage` int NOT NULL,
	`status` enum('pending','credited') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` varchar(50) NOT NULL,
	`status` enum('active','completed','claimed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recharges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` varchar(50) NOT NULL,
	`reference` varchar(256) NOT NULL,
	`proofUrl` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recharges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('investment','recharge','withdrawal','commission') NOT NULL,
	`amount` varchar(50) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` varchar(50) NOT NULL,
	`accountNumber` varchar(256) NOT NULL,
	`bankName` varchar(256) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawals_id` PRIMARY KEY(`id`)
);
