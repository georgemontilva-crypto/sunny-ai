ALTER TABLE `posts` ADD `scheduled_at` timestamp;--> statement-breakpoint
CREATE INDEX `posts_status_scheduled_at_idx` ON `posts` (`status`,`scheduled_at`);