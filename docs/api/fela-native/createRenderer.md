# createRenderer

Creates a Fela renderer which renders your React Native styles utilizing `StyleSheet.create`. It caches all rendered styles to be able to reuse them on future rendering cycles.

## Arguments
| Argument | Type | Description |
| --- | --- | --- |
| config | *Object?* | Optional renderer configuration. The most common use case is adding [plugins](../../advanced/Plugins.md) to process styles before they get cached.<br>*See [Advanced - Renderer Configuration](../../advanced/RendererConfiguration.md) for further information* |

## Returns
([Renderer](Renderer.md)): A Renderer instance.

## Example

```javascript
import { createRenderer } from 'fela-native'

const rule = props => ({
  backgroundColor: 'red',
  fontSize: props.size,
  color: 'blue'
})

const renderer = createRenderer()

renderer.renderRule(rule, { size: 12 })
// => { backgroundColor: 'red', fontSize: 12, color: 'blue' }
```
