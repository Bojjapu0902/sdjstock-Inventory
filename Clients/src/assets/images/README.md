# Logo Assets

Place the company logo here as `logo.webp` (recommended: 200×200 px, transparent background).

To use it in the Loader, update `src/components/common/Loader.jsx`:

```jsx
import Logo from '../../assets/images/logo.webp';

// Inside the loader-icon-box:
<img src={Logo} alt="SDJ Marine" style={{ width: 38, height: 38, objectFit: 'contain' }} />
```
