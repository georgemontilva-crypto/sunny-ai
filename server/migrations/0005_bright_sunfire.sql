CREATE TABLE `posts` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`content` longtext NOT NULL,
	`category` varchar(80),
	`cover_slot` varchar(80),
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`lang` varchar(5) NOT NULL DEFAULT 'en',
	`published_at` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`author_id` varchar(36),
	`meta_title` text,
	`meta_description` text,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `posts_status_published_at_idx` ON `posts` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `posts_slug_idx` ON `posts` (`slug`);