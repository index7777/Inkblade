# ComfyUI interface

This directory defines the generation-side contract. ComfyUI is optional for the
pipeline POC; generated files are not runtime assets until they pass staging and
manual approval.

Output naming:

`{actor}_{layer}_{action}_{direction}_{frame:02}.png`

The Ink Blade POC accepts only `N`, `E`, and `S`, body layer, and walk action.
