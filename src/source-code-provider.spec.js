const mock = require('mock-require');
const path = require('path');

describe('Source code provider', () => {
  let mockFsExtra;
  let mockGlob;
  let Plugin;

  const defaultContent = 'export class SampleSourceCodeProvider {';
  const defaultFilePath = path.join('src', 'app', 'public', 'plugin-resources', 'sample-source-code-provider.ts');

  beforeEach(() => {
    mockFsExtra = {
      ensureFileSync: () => {
        return true;
      },
      pathExistsSync: () => {
        return true;
      },
      readFileSync: (file) => {
        switch (file) {
          default:
            return false;
          case 'src/app/code-examples/sample.component.ts':
            return `import { Component } from '@angular/core';
@Component({
  selector: 'sample',
  templateUrl: './sample.component.html',
  styleUrls: ['./sample.component.scss']
})
export class SampleDemoComponent {}
`;
        }
      }
    };

    mockGlob = {
      sync: () => {
        return [];
      }
    };

    mock('fs-extra', mockFsExtra);
    mock('glob', mockGlob);

    Plugin = mock.reRequire('./plugin').SkyUXPlugin;
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should handle no source files found', () => {
    const plugin = new Plugin();
    const content = Buffer.from(defaultContent, 'utf8');
    const modified = plugin.preload(content, defaultFilePath).toString();

    expect(modified).toContain(`const SOURCE_FILES: SkyDocsSourceCodeFile[] = [];`);
  });

  it('should inject source code information into the provider', () => {
    spyOn(mockGlob, 'sync').and.callFake((pattern) => {
      switch (pattern) {
        default:
          return [];
        case path.join('src/app/code-examples', '**', '*.{ts,js,html,scss}'):
          return [
            'src/app/code-examples/sample.component.ts'
          ];
      }
    });

    const plugin = new Plugin();
    const content = Buffer.from(defaultContent, 'utf8');
    const modified = plugin.preload(content, defaultFilePath).toString();

    expect(modified).toContain(`const SOURCE_FILES: SkyDocsSourceCodeFile[] = [
  {
    "fileName": "sample.component.ts",
    "filePath": "src/app/code-examples/sample.component.ts",
    "rawContents": "import%20%7B%20Component%20%7D%20from%20'%40angular%2Fcore'%3B%0A%40Component(%7B%0A%20%20selector%3A%20'sample'%2C%0A%20%20templateUrl%3A%20'.%2Fsample.component.html'%2C%0A%20%20styleUrls%3A%20%5B'.%2Fsample.component.scss'%5D%0A%7D)%0Aexport%20class%20SampleDemoComponent%20%7B%7D%0A"
  }
];`);
  });
});
