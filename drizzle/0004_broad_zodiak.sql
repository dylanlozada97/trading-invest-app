CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`senderType` enum('user','admin') NOT NULL,
	`message` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
