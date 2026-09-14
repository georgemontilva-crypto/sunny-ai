ALTER TABLE `posts` ADD `cover_key` varchar(255);--> statement-breakpoint
ALTER TABLE `posts` ADD `cover_2x_key` varchar(255);--> statement-breakpoint
ALTER TABLE `posts` ADD `cover_alt` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `cover_width` int;--> statement-breakpoint
ALTER TABLE `posts` ADD `cover_height` int;--> statement-breakpoint
-- Carry each post's blog-cover-* slot over as its own cover: the key, alt
-- and size of the image that slot holds today. A post pointing at a slot
-- nothing was ever uploaded to has no image to carry, and ends up with no
-- cover — which is also what its page shows now.
UPDATE `posts` p
JOIN `media` m ON m.`slot` = p.`cover_slot`
SET
  p.`cover_key` = JSON_UNQUOTE(JSON_EXTRACT(m.`variants`, '$.base.key')),
  p.`cover_2x_key` = JSON_UNQUOTE(JSON_EXTRACT(m.`variants`, '$."2x".key')),
  p.`cover_alt` = NULLIF(m.`alt`, ''),
  p.`cover_width` = CAST(JSON_UNQUOTE(JSON_EXTRACT(m.`variants`, '$.base.width')) AS UNSIGNED),
  p.`cover_height` = CAST(JSON_UNQUOTE(JSON_EXTRACT(m.`variants`, '$.base.height')) AS UNSIGNED)
WHERE JSON_EXTRACT(m.`variants`, '$.base.key') IS NOT NULL;--> statement-breakpoint
-- The slots are gone from server/mediaCatalog.ts; their rows would only linger unseen.
DELETE FROM `media` WHERE `slot` LIKE 'blog-cover-%';--> statement-breakpoint
ALTER TABLE `posts` DROP COLUMN `cover_slot`;