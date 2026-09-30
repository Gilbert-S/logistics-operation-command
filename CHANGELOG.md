# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
...

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



[unreleased]: https://github.com/Gilbert-S/logistics-operation-command/compare/1.2.0...HEAD
[1.2.0]: https://github.com/Gilbert-S/logistics-operation-command/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/Gilbert-S/logistics-operation-command/compare/1.0.0...1.1.0
