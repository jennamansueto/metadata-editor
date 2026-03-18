//text field control
window.AppComponents = window.AppComponents || {};
window.AppComponents['editor-text-field'] = {
    props: ['value'],
    template: `
    <div>
      <input
        class="form-control"    
        v-bind:value="value"
        v-on:input="$emit('input', $event.target.value)"
      >
    </div>
    `
  });