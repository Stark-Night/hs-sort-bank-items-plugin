# Sort HighSpell Bank Items

This is a plugin to sort bank items in the HighSpell game, for the
HighLite client.

## Using the plugin

Once enabled a 🔄 icon will appear on the sidebar. Selecting it will
open a panel with some interactive buttons.  Make sure you read the
warnings.

Selecting a button will start the sorting process. Selecting a
different button while a process is in progress will restart the
process under the new rule.

## Configuring the plugin

The plugin uses HighLite's built-in interface to display its settings.

## Building from source

You need Node version 22 (current LTS release as of the time of this writing).

Run `yarn install` to initialize dependencies and tooling, then `yarn
build` to compile everything.  The bundled plugin will appear under
the `dist/` directory.

If you are adding some features or fixing some bugs, `yarn watch` will
automatically re-build the plugin once a file change and there's no
need to run `yarn build` manually each time.
