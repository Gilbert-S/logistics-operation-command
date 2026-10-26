# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- migrated mono repo to [pnpm]
- migrated front- and backend dockerfile to pnpm
- refactored jdp imports



## [1.4.1] - 2026-10-24

### Fixed
- skip version checks for authentication call backs
- prevent double diff application in overlapping syncs/requests
- additional guards for sync data patching to guruantee iteration is actually newer
- order completion sound



## [1.4.0] - 2026-10-16

### Added
- version checks from this version onward
  - frontend will notify user if it's out of date and auto reload
  - backend will refuse communication with outdated frontends
- swap base label/order-indicator positions
- independent icon/list modes for orders and deliveries

### Fixed
- added robust socket event wrapper to avoid crashes
- validation and rejection of invalid order sync data
- added missing syncId to local order changes (prevented syncing of locally made order changes)
- implemented epochs and acknowledgement callbacks to all sync operations to prevent desync
- immediately update order indicator position when changing ops base positions
- sync base position if draggable ends while still dragging
- base name label clipping

### Changed
- improved visibility of delivery indicator on order items (stripes)
- removed 'Utility' category from ReservePower, Excavation and UnexplodedOrdnance



## [1.3.0] - 2026-10-12

### Added
- display app version in UI

### Changed
- refactor: improve map-data icon layer refresh



## [1.2.0] - 2026-09-30

### Added
- order editor item category filter
- scroll order items into view in order editor when adding/chaning them
- shift(3)/ctrl(5) amount handler for +/- buttons in order editor
- order transfer via base context menu ('transfer orders here')
- store and display order creator

### Fixed
- shirt stack item not showing hover card
- incoherent visuals for items with short descriptions
- added missing damage/sub type icons to relevant icons like mortar ammo and uniforms
- replaced spartan hover cards to eliminate overlay pollution
- subtype/damage type icon icon-mod fallback
- order editor mouse wheel handling (desync)
- delivery list actions transfer, state, cancelation targeting wrong deliveries
- disable order item context menu outside of edit mode
- close draw color panel when clicking on anything sidebar

### Changed
- item hover cards appear/disappear much faster
- compacted item lists for order/delivery view
- improved visual recognizability for completed items within an order
- highlighting of own items in icon mode



## [1.1.0] - 2026-09-24

### Added
- leaflet edgebuffer
- custom map markers
- license
- privacy policy



[unreleased]: https://github.com/Gilbert-S/logistics-operation-command/compare/1.4.1...HEAD
[1.4.1]: https://github.com/Gilbert-S/logistics-operation-command/compare/1.4.0...1.4.1
[1.4.0]: https://github.com/Gilbert-S/logistics-operation-command/compare/1.3.0...1.4.0
[1.3.0]: https://github.com/Gilbert-S/logistics-operation-command/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/Gilbert-S/logistics-operation-command/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/Gilbert-S/logistics-operation-command/compare/1.0.0...1.1.0
[pnpm]: https://pnpm.io
