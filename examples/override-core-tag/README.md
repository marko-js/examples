# Override Marko Core Tag

This is an example of overriding the Marko core `await` tag to enforce a default timeout if the user did not specify a timeout.

## Usage

```marko
$ var personPromise = new Promise((resolve, reject) => {
    setTimeout(function() {
        resolve({
            name: 'Frank'
        });
    }, 15000);
});

<await(person from personPromise)>
    <div>Hello ${person.name}!</div>
</await>
```
