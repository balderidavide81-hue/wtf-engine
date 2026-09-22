# Editorial dashboard

A graphical dashboard is not implemented yet.

For v0.5 the authenticated `/api/editorial` endpoint is the internal editorial control surface. It supports:

- reading an edition with source context;
- reviewing or rejecting draft cards;
- moving a fully reviewed edition to `reviewed`;
- publishing a reviewed edition;
- resolving or voiding an open PREDICT card.

A future UI should consume this authenticated backend rather than duplicating lifecycle logic in the browser.
