UI Design Specification: The Modern Archive

Concept: A minimalist, clean "Digital Archive" that evokes nostalgia through typography and color rather than complex textures.

1. Design Tokens
    
Colors:

PRIMARY: #004B35 (Heritage Green - Ferry/Tram inspiration)

BACKGROUND: #F9F7F2 (Paper White - Aged document feel)

TEXT_MAIN: #222222 (Carbon Ink - High legibility)

TEXT_SUB: #666666 (Faded Ink)

BORDER: #D1CDC0 (Thin line contrast)

ACCENT: #B22222 (Stamp Red - For alerts/actions)

Typography:

HEADING: Serif (iOS: Georgia, Android: serif). Used for titles and headers.

BODY: Sans-Serif (System Default). Used for forms, descriptions, and labels.

Shape & Layout:

RADIUS: 2px to 4px (Avoid large round corners; keep it "boxy").

BORDER: 1px solid weight.

SHADOW: None. Use borders for depth.

2. Component Guidelines

Buttons: Solid PRIMARY background with white text. Rectangular with minimal rounding.

Inputs: Bottom-line only (borderBottomWidth: 1) to simulate old paper forms.

Cards: BACKGROUND color with a 1px BORDER. No elevation/shadow.

Icons: Use thin-stroke line icons (e.g., Lucide or Feather).

3. Page-Specific Logic
A. Auth (Welcome/Login/Sign-up)

Layout: Centered, high whitespace.

Visual: Single serif-font title. Inputs stacked vertically with clear TEXT_MAIN labels.

B. Main (Map View)

Map Style: Apply "Retro" or "Silver" JSON theme to Google Maps.

Overlays: Floating UI elements should have a white background and 1px border. Minimalist icons only.

C. Photo Detail (Record View)

Structure: Image at top, metadata below.

Vibe: Simulate an "Index Card." Use a dashed line divider (borderStyle: 'dashed') to separate sections.

D. Upload (Submission)

Forms: Simple list of fields. Use PRIMARY color for the "Submit" action.

4. Implementation Rules (React Native)

Strictly use the THEME constant for all styling.

No heavy gradients or complex animations.

Prioritize whitespace to maintain the "Archive" clarity.

Language: English only.

Brain Note: Reference this document before generating any TSX/StyleSheet code. Keep it simple, keep it archival.