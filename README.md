This project began as a workaround for the advertisements and popups used as part of the imx.to interface.  The server side script harvests the essential information from the desired gallery pages.  The front end allows navigation through alphanumeric neighbor URLs, showing the first thumbnail for each URL and then allowing you to see all the thumbnails for a particular URL, with the option of saving all (server side at the moment) or just accessing the large version of the images one by one as desired.

Instructions:
Install node.js
Open a node.js command window and change directory to the installed path.
Run "node server_[imx|pixhost].js" (either server_imx.js or server_pixhost.js)

Each is set for a different port (imx=3002, pixhost=3001).

Navigate to 127.0.0.1:<port>/index_[imx|pixhost].html

Lots of bugs in the behavior, but very usable

Fixes planned:
Merge imx/pixhost so the site you want to explore is selected from a dropdown and the codebase isn't split for the two.
Add other gallery hosts.
Fix the navigation behavior a little.
Deal with the server side running out of file handles occasionally.
