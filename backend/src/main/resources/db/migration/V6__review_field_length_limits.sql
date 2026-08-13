-- Cap review text and YouTube URLs to match API validation.
-- Truncate first so existing rows cannot fail the type/check changes.

update reviews
set written_content = left(written_content, 5000)
where char_length(written_content) > 5000;

update reviews
set youtube_url = left(youtube_url, 255)
where youtube_url is not null
  and char_length(youtube_url) > 255;

alter table reviews
    alter column youtube_url type varchar(255);

alter table reviews
    add constraint ck_reviews_written_content_len
    check (char_length(written_content) <= 5000);
