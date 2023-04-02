<script setup lang="ts">
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import ToolingIcon from './icons/IconTooling.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'
import CommunityIcon from './icons/IconCommunity.vue'
</script>

<template>
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon />
    </template>
    <template #heading>Documentation</template>

    Subtopia's
    <a href="https://docs.subtopia.io/" target="_blank" rel="noopener">official documentation</a>
    provides you with all information you need to get started.
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <ToolingIcon />
    </template>
    <template #heading>Tooling</template>

    This project is served and bundled with
    <a href="https://vitejs.dev/guide/features.html" target="_blank" rel="noopener">Vite</a>. The
    recommended IDE setup is
    <a href="https://code.visualstudio.com/" target="_blank" rel="noopener">VSCode</a> +
    <a href="https://github.com/johnsoncodehk/volar" target="_blank" rel="noopener">Volar</a>. If
    you need to test your components and web pages, check out
    <a href="https://www.cypress.io/" target="_blank" rel="noopener">Cypress</a> and
    <a href="https://on.cypress.io/component" target="_blank">Cypress Component Testing</a>.

    <br />

    More instructions are available in <code>README.md</code>.
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <EcosystemIcon />
    </template>
    <template #heading>Ecosystem</template>

    Get official tools and libraries for your project:
    <a href="https://sdk.subtopia.io/" target="_blank" rel="noopener">Subtopia JS SDK</a>,
    <a href="https://docs.subtopia.io/" target="_blank" rel="noopener">Subtopia Platform Docs</a>,
    <a href="https://api.subtopia.io/" target="_blank" rel="noopener">Subtopia API docs</a>,
    <a href="https://github.com/subtopia-algo/subtopia-js-examples" target="_blank" rel="noopener"
      >Subtopia JS examples</a
    >, and
    <a href="https://awesomealgo.com" target="_blank" rel="noopener"
      >Awesome Algorand repository of dev tools in the ecosystem</a
    >. If you need Vue specific resources, we suggest paying
    <a href="https://github.com/vuejs/awesome-vue" target="_blank" rel="noopener">Awesome Vue</a>
    a visit.
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <CommunityIcon />
    </template>
    <template #heading>Community</template>

    Got stuck? Ask your question on
    <a href="https://discord.gg/JCjHpXHy" target="_blank" rel="noopener"
      >Subtopia Community Server</a
    >, our official Discord server, or email to
    <a href="mailto:info@subtopia.io" target="_blank" rel="noopener">info@subtopa.io</a>. You should
    also subscribe to
    <a href="https://twitter.com/subtopia_algo" target="_blank" rel="noopener">@subtopia_algo</a>
    twitter account for latest news in the Vue world.
  </WelcomeItem>
</template>
