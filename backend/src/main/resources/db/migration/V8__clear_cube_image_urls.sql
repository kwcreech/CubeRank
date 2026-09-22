-- Product photographs were store CDN URLs. Clear them so the catalog no longer serves those images.
update cubes
set image_url = null
where image_url is not null;
