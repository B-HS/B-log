ALTER TABLE `message` ADD `reply_to_id` text REFERENCES message(id);--> statement-breakpoint
ALTER TABLE `message` ADD `retweet_of_id` text REFERENCES message(id);