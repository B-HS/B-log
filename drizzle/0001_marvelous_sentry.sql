CREATE TABLE `image_asset` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`bucket` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`width` integer,
	`height` integer,
	`checksum` text,
	`uploaded_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `image_asset_r2_key_unique` ON `image_asset` (`r2_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `image_asset_r2_key_idx` ON `image_asset` (`r2_key`);--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_user_created_idx` ON `message` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `message_image` (
	`message_id` text NOT NULL,
	`image_id` text NOT NULL,
	`order` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`message_id`) REFERENCES `message`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `image_asset`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_image_pk` ON `message_image` (`message_id`,`image_id`);--> statement-breakpoint
CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`topic` text NOT NULL,
	`priority` integer,
	`tags` text,
	`click_url` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `notification_delivery` (
	`id` text PRIMARY KEY NOT NULL,
	`notification_id` text NOT NULL,
	`attempt` integer NOT NULL,
	`status` text NOT NULL,
	`http_code` integer,
	`error` text,
	`ntfy_message_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`notification_id`) REFERENCES `notification`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_delivery_unique_attempt` ON `notification_delivery` (`notification_id`,`attempt`);--> statement-breakpoint
CREATE TABLE `notification_topic` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`topic` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_topic_user_topic_uq` ON `notification_topic` (`user_id`,`topic`);