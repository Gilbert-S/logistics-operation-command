import { Directionality } from '@angular/cdk/bidi';
import { Overlay, OverlayPositionBuilder, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import * as i0 from '@angular/core';
import { InjectionToken, inject, signal, computed, afterNextRender, Injector, TemplateRef, Injectable, DestroyRef, ViewContainerRef, output, input, booleanAttribute, effect, untracked, Directive } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { cssClassesToArray, waitForAnimations, getActiveElementAnimations, provideExposesStateProviderExisting } from '@spartan-ng/brain/core';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { TemplatePortal, ComponentPortal } from '@angular/cdk/portal';
import { Subject, ReplaySubject, merge } from 'rxjs';
import { takeUntil, map, filter } from 'rxjs/operators';

const createDefaultOptions = () => ({
    attachPositions: [],
    attachTo: null,
    autoFocus: false,
    backdropClass: '',
    closeOnOutsidePointerEvents: false,
    disableClose: false,
    hasBackdrop: false,
    panelClass: '',
    positionStrategy: null,
    role: null,
    scrollStrategy: null,
});
const cloneDefaultOptions = (options) => ({
    ...options,
    attachPositions: [...options.attachPositions],
});
const defaultOptions = createDefaultOptions();
const BRN_OVERLAY_DEFAULT_OPTIONS = new InjectionToken('brn-overlay-default-options', {
    providedIn: 'root',
    factory: createDefaultOptions,
});
function provideBrnOverlayDefaultOptions(options) {
    return {
        provide: BRN_OVERLAY_DEFAULT_OPTIONS,
        useValue: cloneDefaultOptions({ ...createDefaultOptions(), ...options }),
    };
}
function injectBrnOverlayDefaultOptions() {
    return cloneDefaultOptions(inject(BRN_OVERLAY_DEFAULT_OPTIONS, { optional: true }) ?? defaultOptions);
}
const BRN_OVERLAY_DATA = new InjectionToken('brn-overlay-data');
function injectBrnOverlayContext() {
    return inject(BRN_OVERLAY_DATA);
}

class BrnOverlayRef {
    _overlayRef;
    _injector;
    overlayId;
    initialOptions;
    _onDisposed;
    _closing = new Subject();
    closing$ = this._closing.asObservable();
    _closed = new ReplaySubject(1);
    closed$ = this._closed.asObservable();
    _stateChanged = new ReplaySubject(1);
    stateChanged$ = this._stateChanged.asObservable();
    _phase = signal('open', ...(ngDevMode ? [{ debugName: "_phase" }] : /* istanbul ignore next */ []));
    phase = this._phase.asReadonly();
    state = computed(() => (this._phase() === 'open' ? 'open' : 'closed'), ...(ngDevMode ? [{ debugName: "state" }] : /* istanbul ignore next */ []));
    _closeGeneration = 0;
    _panelClasses;
    _backdropClasses;
    get open() {
        return this._phase() === 'open';
    }
    get id() {
        return this.initialOptions.id;
    }
    constructor(_overlayRef, _injector, overlayId, initialOptions, _onDisposed) {
        this._overlayRef = _overlayRef;
        this._injector = _injector;
        this.overlayId = overlayId;
        this.initialOptions = initialOptions;
        this._onDisposed = _onDisposed;
        this._panelClasses = cssClassesToArray(initialOptions.panelClass);
        this._backdropClasses = cssClassesToArray(initialOptions.backdropClass);
        this._setDataState('open');
        this._stateChanged.next('open');
    }
    close(result) {
        if (!this.open)
            return;
        const generation = ++this._closeGeneration;
        const animationsBeforeClose = new Set(this._getActiveAnimations());
        this._phase.set('closing');
        this._setDataState('closed');
        this._closing.next();
        this._stateChanged.next('closed');
        afterNextRender(() => {
            void this._finishClose(generation, animationsBeforeClose, result);
        }, { injector: this._injector });
    }
    dismiss(reason, target) {
        const options = this.initialOptions;
        if (!this.open || options.disableClose)
            return false;
        if (reason === 'outside') {
            if (!options.closeOnOutsidePointerEvents)
                return false;
            // The trigger lives outside the overlay panel, so CDK reports clicks on it as "outside".
            // Treat them as inside the widget and let the trigger's own handler toggle instead - this
            // avoids a close/re-open race that flickers the open/close animation.
            if (this._isWithinOrigin(target))
                return false;
        }
        this.close();
        return true;
    }
    /** Whether the event target sits within the overlay's origin (its trigger/anchor element). */
    _isWithinOrigin(target) {
        const origin = this.initialOptions.attachTo;
        if (!origin || !(target instanceof Node))
            return false;
        const element = origin instanceof Element ? origin : 'nativeElement' in origin ? origin.nativeElement : null;
        return element instanceof Element && element.contains(target);
    }
    reopen() {
        if (this._phase() !== 'closing')
            return;
        this._closeGeneration++;
        this._phase.set('open');
        this._setDataState('open');
        this._stateChanged.next('open');
    }
    forceClose(result) {
        if (this._phase() === 'closed')
            return;
        this._closeGeneration++;
        this._dispose(result);
    }
    setPanelClass(panelClass) {
        if (this._panelClasses.length)
            this._overlayRef.removePanelClass(this._panelClasses);
        this._panelClasses = cssClassesToArray(panelClass);
        if (this._panelClasses.length)
            this._overlayRef.addPanelClass(this._panelClasses);
    }
    setBackdropClass(backdropClass) {
        const backdrop = this._overlayRef.backdropElement;
        if (!backdrop)
            return;
        backdrop.classList.remove(...this._backdropClasses);
        this._backdropClasses = cssClassesToArray(backdropClass);
        backdrop.classList.add(...this._backdropClasses);
    }
    updatePosition() {
        this._overlayRef.updatePosition();
    }
    async _finishClose(generation, animationsBeforeClose, result) {
        if (generation !== this._closeGeneration || this._phase() !== 'closing')
            return;
        const exitAnimations = this._getActiveAnimations().filter((animation) => !animationsBeforeClose.has(animation));
        // Pin each exit animation to its final frame. tw-animate-css uses `animation-fill-mode: none`,
        // so a finished exit reverts the element to its visible state in the gap before we dispose it -
        // that one-frame snap-back is the flicker. updateTiming pins only the animations we await.
        for (const animation of exitAnimations) {
            animation.effect?.updateTiming({ fill: 'forwards' });
        }
        await waitForAnimations(exitAnimations);
        if (generation === this._closeGeneration && this._phase() === 'closing') {
            this._dispose(result);
        }
    }
    _dispose(result) {
        this._phase.set('closed');
        this._overlayRef.dispose();
        this._onDisposed();
        this._closed.next(result);
        this._closed.complete();
        this._closing.complete();
        this._stateChanged.complete();
    }
    _getActiveAnimations() {
        return getActiveElementAnimations([this._overlayRef.overlayElement, this._overlayRef.backdropElement]);
    }
    _setDataState(state) {
        this._overlayRef.overlayElement.setAttribute('data-state', state);
        this._overlayRef.backdropElement?.setAttribute('data-state', state);
    }
}

let overlaySequence = 0;
class BrnOverlayService {
    _overlay = inject(Overlay);
    _positionBuilder = inject(OverlayPositionBuilder);
    _scrollStrategies = inject(ScrollStrategyOptions);
    _injector = inject(Injector);
    _interactivityChecker = inject(InteractivityChecker);
    _defaultOptions = injectBrnOverlayDefaultOptions();
    _openOverlayIds = new Set();
    _overlayStack = [];
    open(content, vcr, context, options) {
        const overlayId = ++overlaySequence;
        const mergedOptions = {
            ...this._defaultOptions,
            ...options,
            id: options?.id ?? `brn-overlay-${overlayId}`,
        };
        if (this._openOverlayIds.has(mergedOptions.id)) {
            throw new Error(`Overlay with ID: ${mergedOptions.id} already exists`);
        }
        const overlayRef = this._overlay.create({
            positionStrategy: mergedOptions.positionStrategy ??
                (mergedOptions.attachTo && mergedOptions.attachPositions.length
                    ? this._positionBuilder
                        .flexibleConnectedTo(mergedOptions.attachTo)
                        .withPositions(mergedOptions.attachPositions)
                    : this._positionBuilder.global().centerHorizontally().centerVertically()),
            scrollStrategy: mergedOptions.scrollStrategy === 'close'
                ? this._scrollStrategies.close()
                : mergedOptions.scrollStrategy === 'reposition'
                    ? this._scrollStrategies.reposition()
                    : (mergedOptions.scrollStrategy ?? this._scrollStrategies.block()),
            hasBackdrop: mergedOptions.hasBackdrop,
            panelClass: mergedOptions.panelClass,
            backdropClass: mergedOptions.backdropClass,
            direction: mergedOptions.direction,
        });
        const destroyed = new Subject();
        const brnOverlayRef = new BrnOverlayRef(overlayRef, this._injector, overlayId, mergedOptions, () => {
            destroyed.next();
            destroyed.complete();
            this._openOverlayIds.delete(mergedOptions.id);
            this._removeFromStack(overlayRef);
        });
        const contextOrData = {
            ...context,
            close: (result = undefined) => brnOverlayRef.close(result),
        };
        const portalInjector = Injector.create({
            parent: vcr?.injector ?? this._injector,
            providers: this._createProviders(brnOverlayRef, contextOrData, mergedOptions),
        });
        this._configureElement(overlayRef, mergedOptions);
        this._openOverlayIds.add(mergedOptions.id);
        this._overlayStack.push(overlayRef);
        this._connectDismissalEvents(brnOverlayRef, overlayRef, destroyed);
        overlayRef
            .detachments()
            .pipe(takeUntil(destroyed))
            .subscribe(() => brnOverlayRef.forceClose());
        try {
            if (content instanceof TemplateRef) {
                if (!vcr)
                    throw new Error('A ViewContainerRef is required to open an overlay from a TemplateRef');
                overlayRef.attach(new TemplatePortal(content, vcr, { $implicit: contextOrData }, portalInjector));
            }
            else {
                overlayRef.attach(new ComponentPortal(content, vcr, portalInjector));
            }
        }
        catch (error) {
            brnOverlayRef.forceClose();
            throw error;
        }
        if (mergedOptions.autoFocus) {
            this._focusInitialElement(overlayRef, destroyed);
        }
        return brnOverlayRef;
    }
    /**
     * Moves focus to the first tabbable element inside the overlay once its content has rendered.
     * If the overlay has no tabbable content (e.g. a select listbox), focus is left untouched so the
     * trigger keeps it - this is what keeps the `aria-activedescendant` keyboard model working.
     */
    _focusInitialElement(overlayRef, destroyed) {
        let cancelled = false;
        destroyed.subscribe(() => (cancelled = true));
        afterNextRender(() => {
            if (cancelled)
                return;
            const root = overlayRef.overlayElement;
            if (!root)
                return;
            const target = this._firstTabbableElement(root);
            target?.focus();
        }, { injector: this._injector });
    }
    _firstTabbableElement(root) {
        const candidates = root.querySelectorAll('a[href], button, input, textarea, select, [tabindex], [contenteditable="true"]');
        for (const candidate of Array.from(candidates)) {
            if (this._interactivityChecker.isTabbable(candidate))
                return candidate;
        }
        return null;
    }
    _createProviders(ref, context, options) {
        const providers = [
            { provide: BrnOverlayRef, useValue: ref },
            { provide: BRN_OVERLAY_DATA, useValue: context },
        ];
        if (options.providers) {
            providers.push(...(typeof options.providers === 'function' ? options.providers() : options.providers));
        }
        return providers;
    }
    _configureElement(overlayRef, options) {
        const element = overlayRef.overlayElement;
        element.id = options.id;
        if (options.role) {
            element.tabIndex = -1;
            element.setAttribute('role', options.role);
        }
    }
    _connectDismissalEvents(ref, overlayRef, destroyed) {
        merge(overlayRef.outsidePointerEvents().pipe(map((event) => ({ event, reason: 'outside' }))), overlayRef.backdropClick().pipe(map((event) => ({ event, reason: 'backdrop' }))), overlayRef.keydownEvents().pipe(filter((event) => event.key === 'Escape'), map((event) => ({ event, reason: 'escape' }))))
            .pipe(takeUntil(destroyed))
            .subscribe(({ event, reason }) => this._requestDismissal(ref, overlayRef, reason, event));
    }
    _requestDismissal(ref, overlayRef, reason, event) {
        if (this._overlayStack.at(-1) !== overlayRef)
            return;
        if (ref.dismiss(reason, event.target) && reason === 'escape')
            event.preventDefault();
    }
    _removeFromStack(overlayRef) {
        const index = this._overlayStack.indexOf(overlayRef);
        if (index !== -1)
            this._overlayStack.splice(index, 1);
    }
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlayService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    /** @nocollapse */ static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlayService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlayService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });

let overlayIdSequence = 0;
class BrnOverlay {
    _overlayService = inject(BrnOverlayService);
    _destroyRef = inject(DestroyRef);
    _vcr = inject(ViewContainerRef);
    _positionBuilder = inject(OverlayPositionBuilder);
    _scrollStrategies = inject(ScrollStrategyOptions);
    _injector = inject(Injector);
    _directionality = inject(Directionality);
    _document = inject(DOCUMENT);
    _defaultOptions = this.getDefaultOptions();
    _overlayRef = signal(undefined, ...(ngDevMode ? [{ debugName: "_overlayRef" }] : /* istanbul ignore next */ []));
    _origin = signal(undefined, ...(ngDevMode ? [{ debugName: "_origin" }] : /* istanbul ignore next */ []));
    _panelClass = signal(undefined, ...(ngDevMode ? [{ debugName: "_panelClass" }] : /* istanbul ignore next */ []));
    _backdropClass = signal(undefined, ...(ngDevMode ? [{ debugName: "_backdropClass" }] : /* istanbul ignore next */ []));
    _content;
    _destroyed = false;
    _resolvedBackdropClass = computed(() => this._backdropClass() ?? this._defaultOptions.backdropClass, ...(ngDevMode ? [{ debugName: "_resolvedBackdropClass" }] : /* istanbul ignore next */ []));
    _resolvedPanelClass = computed(() => this._panelClass() ?? this._content?.panelClass() ?? this._defaultOptions.panelClass, ...(ngDevMode ? [{ debugName: "_resolvedPanelClass" }] : /* istanbul ignore next */ []));
    closed = output();
    stateChanged = output();
    stateComputed = computed(() => this._overlayRef()?.state() ?? 'closed', ...(ngDevMode ? [{ debugName: "stateComputed" }] : /* istanbul ignore next */ []));
    id = input(`brn-overlay-${++overlayIdSequence}`, ...(ngDevMode ? [{ debugName: "id" }] : /* istanbul ignore next */ []));
    state = input(null, ...(ngDevMode ? [{ debugName: "state" }] : /* istanbul ignore next */ []));
    role = input(this._defaultOptions.role, ...(ngDevMode ? [{ debugName: "role" }] : /* istanbul ignore next */ []));
    hasBackdrop = input(this._defaultOptions.hasBackdrop, { ...(ngDevMode ? { debugName: "hasBackdrop" } : /* istanbul ignore next */ {}), transform: booleanAttribute });
    positionStrategy = input(this._defaultOptions.positionStrategy, ...(ngDevMode ? [{ debugName: "positionStrategy" }] : /* istanbul ignore next */ []));
    scrollStrategy = input(this._defaultOptions.scrollStrategy, ...(ngDevMode ? [{ debugName: "scrollStrategy" }] : /* istanbul ignore next */ []));
    closeOnOutsidePointerEvents = input(this._defaultOptions.closeOnOutsidePointerEvents, { ...(ngDevMode ? { debugName: "closeOnOutsidePointerEvents" } : /* istanbul ignore next */ {}), transform: booleanAttribute });
    attachTo = input(this._defaultOptions.attachTo, ...(ngDevMode ? [{ debugName: "attachTo" }] : /* istanbul ignore next */ []));
    attachPositions = input(this._defaultOptions.attachPositions, ...(ngDevMode ? [{ debugName: "attachPositions" }] : /* istanbul ignore next */ []));
    disableClose = input(this._defaultOptions.disableClose, { ...(ngDevMode ? { debugName: "disableClose" } : /* istanbul ignore next */ {}), transform: booleanAttribute });
    autoFocus = input(this._defaultOptions.autoFocus, { ...(ngDevMode ? { debugName: "autoFocus" } : /* istanbul ignore next */ {}), transform: booleanAttribute });
    _options = computed(() => ({
        id: this.id(),
        role: this.role(),
        direction: this._directionality.valueSignal(),
        hasBackdrop: this.hasBackdrop(),
        positionStrategy: this.getPositionStrategy(),
        scrollStrategy: this.getScrollStrategy(),
        closeOnOutsidePointerEvents: this.closeOnOutsidePointerEvents(),
        attachTo: this.getAttachTo(),
        attachPositions: this.getAttachPositions(),
        disableClose: this.disableClose(),
        autoFocus: this.autoFocus(),
        backdropClass: cssClassesToArray(this._resolvedBackdropClass()),
        panelClass: cssClassesToArray(this._resolvedPanelClass()),
    }), ...(ngDevMode ? [{ debugName: "_options" }] : /* istanbul ignore next */ []));
    constructor() {
        // Registered first so the flag is set before forceClose() below tears the overlay down and
        // emits on closed$/stateChanged$ - otherwise those emits hit a destroyed OutputRef (NG0953).
        this._destroyRef.onDestroy(() => (this._destroyed = true));
        this._destroyRef.onDestroy(() => this._overlayRef()?.forceClose());
        this._syncPanelClass();
        this._syncBackdropClass();
        afterNextRender(() => {
            effect(() => {
                const state = this.state();
                if (state === 'open')
                    untracked(() => this.open());
                if (state === 'closed')
                    untracked(() => this.close());
            }, { injector: this._injector });
        });
    }
    getDefaultOptions() {
        return injectBrnOverlayDefaultOptions();
    }
    open() {
        if (!this._content)
            return;
        const currentRef = this._overlayRef();
        if (currentRef) {
            currentRef.reopen();
            return;
        }
        const elementToRestoreFocusTo = this._document.activeElement;
        const overlayRef = this._overlayService.open(this._content.template, this._vcr, this._content.context() ?? {}, this._options());
        this._overlayRef.set(overlayRef);
        overlayRef.stateChanged$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((state) => {
            if (!this._destroyed)
                this.stateChanged.emit(state);
        });
        overlayRef.closed$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe((result) => {
            if (this._overlayRef() === overlayRef)
                this._overlayRef.set(undefined);
            this._restoreFocus(elementToRestoreFocusTo);
            if (!this._destroyed)
                this.closed.emit(result);
        });
    }
    close(result) {
        this._overlayRef()?.close(result);
    }
    toggle(result) {
        this.stateComputed() === 'open' ? this.close(result) : this.open();
    }
    registerContent(template, context, panelClass) {
        this._content = { template, context, panelClass };
    }
    setOrigin(origin) {
        this._origin.set(origin);
    }
    setOverlayClass(overlayClass) {
        this._backdropClass.set(overlayClass);
        this._overlayRef()?.setBackdropClass(overlayClass);
    }
    setPanelClass(panelClass) {
        this._panelClass.set(panelClass);
        this._overlayRef()?.setPanelClass(panelClass);
    }
    updatePosition() {
        this._overlayRef()?.updatePosition();
    }
    getAttachTo() {
        return this.attachTo() ?? this._origin();
    }
    getAttachPositions() {
        return this.attachPositions();
    }
    getPositionStrategy() {
        return this.positionStrategy();
    }
    getScrollStrategy() {
        const strategy = this.scrollStrategy();
        if (strategy === 'close')
            return this._scrollStrategies.close();
        if (strategy === 'reposition')
            return this._scrollStrategies.reposition();
        return strategy;
    }
    _restoreFocus(element) {
        const HTMLElementCtor = this._document.defaultView?.HTMLElement;
        if (!HTMLElementCtor ||
            !(element instanceof HTMLElementCtor) ||
            element === this._document.body ||
            !element.isConnected) {
            return;
        }
        const activeElement = this._document.activeElement;
        const shouldRestoreFocus = activeElement === this._document.body || !activeElement || !activeElement.isConnected;
        if (shouldRestoreFocus)
            element.focus({ preventScroll: true });
    }
    _syncPanelClass() {
        effect(() => {
            const overlayRef = this._overlayRef();
            if (!overlayRef)
                return;
            const panelClass = this._resolvedPanelClass();
            untracked(() => overlayRef.setPanelClass(panelClass));
        }, { injector: this._injector });
    }
    _syncBackdropClass() {
        effect(() => {
            const overlayRef = this._overlayRef();
            if (!overlayRef)
                return;
            const backdropClass = this._resolvedBackdropClass();
            untracked(() => overlayRef.setBackdropClass(backdropClass));
        }, { injector: this._injector });
    }
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlay, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    /** @nocollapse */ static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "21.2.16", type: BrnOverlay, isStandalone: true, selector: "[brnOverlay],brn-overlay", inputs: { id: { classPropertyName: "id", publicName: "id", isSignal: true, isRequired: false, transformFunction: null }, state: { classPropertyName: "state", publicName: "state", isSignal: true, isRequired: false, transformFunction: null }, role: { classPropertyName: "role", publicName: "role", isSignal: true, isRequired: false, transformFunction: null }, hasBackdrop: { classPropertyName: "hasBackdrop", publicName: "hasBackdrop", isSignal: true, isRequired: false, transformFunction: null }, positionStrategy: { classPropertyName: "positionStrategy", publicName: "positionStrategy", isSignal: true, isRequired: false, transformFunction: null }, scrollStrategy: { classPropertyName: "scrollStrategy", publicName: "scrollStrategy", isSignal: true, isRequired: false, transformFunction: null }, closeOnOutsidePointerEvents: { classPropertyName: "closeOnOutsidePointerEvents", publicName: "closeOnOutsidePointerEvents", isSignal: true, isRequired: false, transformFunction: null }, attachTo: { classPropertyName: "attachTo", publicName: "attachTo", isSignal: true, isRequired: false, transformFunction: null }, attachPositions: { classPropertyName: "attachPositions", publicName: "attachPositions", isSignal: true, isRequired: false, transformFunction: null }, disableClose: { classPropertyName: "disableClose", publicName: "disableClose", isSignal: true, isRequired: false, transformFunction: null }, autoFocus: { classPropertyName: "autoFocus", publicName: "autoFocus", isSignal: true, isRequired: false, transformFunction: null } }, outputs: { closed: "closed", stateChanged: "stateChanged" }, exportAs: ["brnOverlay"], ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlay, decorators: [{
            type: Directive,
            args: [{
                    selector: '[brnOverlay],brn-overlay',
                    exportAs: 'brnOverlay',
                }]
        }], ctorParameters: () => [], propDecorators: { closed: [{ type: i0.Output, args: ["closed"] }], stateChanged: [{ type: i0.Output, args: ["stateChanged"] }], id: [{ type: i0.Input, args: [{ isSignal: true, alias: "id", required: false }] }], state: [{ type: i0.Input, args: [{ isSignal: true, alias: "state", required: false }] }], role: [{ type: i0.Input, args: [{ isSignal: true, alias: "role", required: false }] }], hasBackdrop: [{ type: i0.Input, args: [{ isSignal: true, alias: "hasBackdrop", required: false }] }], positionStrategy: [{ type: i0.Input, args: [{ isSignal: true, alias: "positionStrategy", required: false }] }], scrollStrategy: [{ type: i0.Input, args: [{ isSignal: true, alias: "scrollStrategy", required: false }] }], closeOnOutsidePointerEvents: [{ type: i0.Input, args: [{ isSignal: true, alias: "closeOnOutsidePointerEvents", required: false }] }], attachTo: [{ type: i0.Input, args: [{ isSignal: true, alias: "attachTo", required: false }] }], attachPositions: [{ type: i0.Input, args: [{ isSignal: true, alias: "attachPositions", required: false }] }], disableClose: [{ type: i0.Input, args: [{ isSignal: true, alias: "disableClose", required: false }] }], autoFocus: [{ type: i0.Input, args: [{ isSignal: true, alias: "autoFocus", required: false }] }] } });

class BrnOverlayClose {
    _brnOverlayRef = inject(BrnOverlayRef);
    close() {
        this._brnOverlayRef.close();
    }
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlayClose, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    /** @nocollapse */ static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "21.2.16", type: BrnOverlayClose, isStandalone: true, selector: "button[brnOverlayClose]", host: { listeners: { "click": "close()" } }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlayClose, decorators: [{
            type: Directive,
            args: [{
                    selector: 'button[brnOverlayClose]',
                    host: {
                        '(click)': 'close()',
                    },
                }]
        }] });

class BrnOverlayContent {
    _brnOverlay = inject(BrnOverlay, { optional: true });
    _brnOverlayRef = inject(BrnOverlayRef, { optional: true });
    _template = inject(TemplateRef);
    state = computed(() => this._brnOverlay?.stateComputed() ?? this._brnOverlayRef?.state() ?? 'closed', ...(ngDevMode ? [{ debugName: "state" }] : /* istanbul ignore next */ []));
    className = input(undefined, { ...(ngDevMode ? { debugName: "className" } : /* istanbul ignore next */ {}), alias: 'class' });
    context = input(undefined, ...(ngDevMode ? [{ debugName: "context" }] : /* istanbul ignore next */ []));
    constructor() {
        this._brnOverlay?.registerContent(this._template, this.context, this.className);
    }
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlayContent, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    /** @nocollapse */ static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "21.2.16", type: BrnOverlayContent, isStandalone: true, selector: "[brnOverlayContent]", inputs: { className: { classPropertyName: "className", publicName: "class", isSignal: true, isRequired: false, transformFunction: null }, context: { classPropertyName: "context", publicName: "context", isSignal: true, isRequired: false, transformFunction: null } }, providers: [provideExposesStateProviderExisting((() => BrnOverlayContent))], ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlayContent, decorators: [{
            type: Directive,
            args: [{
                    selector: '[brnOverlayContent]',
                    providers: [provideExposesStateProviderExisting((() => BrnOverlayContent))],
                }]
        }], ctorParameters: () => [], propDecorators: { className: [{ type: i0.Input, args: [{ isSignal: true, alias: "class", required: false }] }], context: [{ type: i0.Input, args: [{ isSignal: true, alias: "context", required: false }] }] } });

let triggerIdSequence = 0;
class BrnOverlayTrigger {
    _injectedOverlay = inject(BrnOverlay, { optional: true });
    _overlayRef = inject(BrnOverlayRef, { optional: true });
    id = input(`brn-overlay-trigger-${++triggerIdSequence}`, ...(ngDevMode ? [{ debugName: "id" }] : /* istanbul ignore next */ []));
    type = input('button', ...(ngDevMode ? [{ debugName: "type" }] : /* istanbul ignore next */ []));
    brnOverlayTriggerFor = input(undefined, ...(ngDevMode ? [{ debugName: "brnOverlayTriggerFor" }] : /* istanbul ignore next */ []));
    state = computed(() => this.getOverlay()?.stateComputed() ?? this._overlayRef?.state() ?? 'closed', ...(ngDevMode ? [{ debugName: "state" }] : /* istanbul ignore next */ []));
    overlayId = computed(() => this.getOverlay()?.id() ?? this._overlayRef?.id ?? null, ...(ngDevMode ? [{ debugName: "overlayId" }] : /* istanbul ignore next */ []));
    getOverlay() {
        return this.brnOverlayTriggerFor() ?? this._injectedOverlay ?? undefined;
    }
    open() {
        this.getOverlay()?.open();
    }
    toggle() {
        this.getOverlay()?.toggle();
    }
    /** @nocollapse */ static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlayTrigger, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    /** @nocollapse */ static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "17.1.0", version: "21.2.16", type: BrnOverlayTrigger, isStandalone: true, selector: "button[brnOverlayTrigger],button[brnOverlayTriggerFor]", inputs: { id: { classPropertyName: "id", publicName: "id", isSignal: true, isRequired: false, transformFunction: null }, type: { classPropertyName: "type", publicName: "type", isSignal: true, isRequired: false, transformFunction: null }, brnOverlayTriggerFor: { classPropertyName: "brnOverlayTriggerFor", publicName: "brnOverlayTriggerFor", isSignal: true, isRequired: false, transformFunction: null } }, host: { listeners: { "click": "toggle()" }, properties: { "id": "id()", "attr.aria-expanded": "state() === 'open' ? 'true' : 'false'", "attr.data-state": "state()", "attr.aria-controls": "overlayId()", "type": "type()" } }, exportAs: ["brnOverlayTrigger"], ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "21.2.16", ngImport: i0, type: BrnOverlayTrigger, decorators: [{
            type: Directive,
            args: [{
                    selector: 'button[brnOverlayTrigger],button[brnOverlayTriggerFor]',
                    exportAs: 'brnOverlayTrigger',
                    host: {
                        '[id]': 'id()',
                        '(click)': 'toggle()',
                        '[attr.aria-expanded]': "state() === 'open' ? 'true' : 'false'",
                        '[attr.data-state]': 'state()',
                        '[attr.aria-controls]': 'overlayId()',
                        '[type]': 'type()',
                    },
                }]
        }], propDecorators: { id: [{ type: i0.Input, args: [{ isSignal: true, alias: "id", required: false }] }], type: [{ type: i0.Input, args: [{ isSignal: true, alias: "type", required: false }] }], brnOverlayTriggerFor: [{ type: i0.Input, args: [{ isSignal: true, alias: "brnOverlayTriggerFor", required: false }] }] } });

const BrnOverlayImports = [BrnOverlay, BrnOverlayTrigger, BrnOverlayClose, BrnOverlayContent];

/**
 * Generated bundle index. Do not edit.
 */

export { BRN_OVERLAY_DATA, BRN_OVERLAY_DEFAULT_OPTIONS, BrnOverlay, BrnOverlayClose, BrnOverlayContent, BrnOverlayImports, BrnOverlayRef, BrnOverlayService, BrnOverlayTrigger, defaultOptions, injectBrnOverlayContext, injectBrnOverlayDefaultOptions, provideBrnOverlayDefaultOptions };
//# sourceMappingURL=spartan-ng-brain-overlay.mjs.map
