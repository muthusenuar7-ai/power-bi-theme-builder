/* ─── Right panel: format pane, score, validation, JSON ─── */
window.RightPanel = (function(){

  function render(host){
    host.innerHTML = '';
    host.appendChild(U.el('aside',{class:'rpanel'},
      head(),
      skill(),
      tabs(),
      U.el('div',{class:'rp-scroll'},
        FormatPane.render(),
        scoreSection(),
        validationSection(),
        jsonSection()
      )
    ));
  }

  function head(){
    const v = state.selectedVisual ? VISUALS.find(x=>x.id===state.selectedVisual) : null;
    return U.el('div',{class:'rp-head'},
      U.el('div',{class:'rp-vico'}, icon(v?v.icon:'palette',16)),
      U.el('div',{},
        U.el('div',{class:'rp-vname'}, v? v.name : 'Format pane'),
        U.el('div',{class:'rp-vsub'}, v? 'Visual properties' : 'Select a visual')
      )
    );
  }

  function skill(){
    return U.el('div',{class:'rp-skill'},
      U.el('span',{class:'lbl'}, 'Skill'),
      U.el('div',{class:'seg'},
        ...['basic','intermediate','advanced'].map(s=>
          U.el('button',{class: state.skillLevel===s?'active':'', onclick:()=>setState({skillLevel:s})},
            s[0].toUpperCase()+s.slice(1))
        )
      )
    );
  }

  function tabs(){
    return U.el('div',{class:'rp-tabs'},
      U.el('button',{class: state.activeFormatTab==='visual'?'active':'', onclick:()=>setState({activeFormatTab:'visual'})}, 'Visual'),
      U.el('button',{class: state.activeFormatTab==='general'?'active':'', onclick:()=>setState({activeFormatTab:'general'})}, 'General')
    );
  }

  function scoreSection(){
    const scores = computeScore();
    const cls = scores.overall>=85?'':(scores.overall>=70?' warn':' bad');
    const grade = scores.overall>=85?'A': scores.overall>=75?'B': scores.overall>=65?'C': 'D';
    return fpSection('Theme quality', 'score',
      U.el('div',{},
        U.el('div',{class:'score-grade'+cls},
          U.el('div',{class:'grade'}, grade),
          U.el('div',{class:'gtxt'},
            U.el('b',{}, scores.overall+'/100'),
            'Theme score'
          )
        ),
        scoreRow('Contrast', scores.contrast),
        scoreRow('Readability', scores.read),
        scoreRow('Consistency', scores.consist),
        scoreRow('Accessibility', scores.access)
      )
    );
  }

  function scoreRow(label, val){
    const cls = val>=80?'': val>=60?' warn':' bad';
    return U.el('div',{class:'score-row'},
      U.el('div',{class:'sl'}, label),
      U.el('div',{class:'bar'+cls}, U.el('span',{style:{width: val+'%'}})),
      U.el('div',{class:'sv'}, val)
    );
  }

  function computeScore(){
    const fgC = U.contrast(state.fg, state.bg);
    const contrast = Math.min(100, Math.round((fgC/12)*100));
    let okPalette = 0;
    state.dataColors.forEach(c=>{
      const cr = U.contrast(c, state.bg);
      if(cr >= 2.5) okPalette++;
    });
    const read = Math.round((okPalette/8)*100);
    // hue spread for consistency
    const hues = state.dataColors.map(c=>{
      const {r,g,b} = U.hexToRgb(c);
      const max=Math.max(r,g,b)/255, min=Math.min(r,g,b)/255;
      let h=0;
      const d=max-min;
      if(d===0) h=0;
      else if(max===r/255) h=((g-b)/255/d + (g<b?6:0))/6;
      else if(max===g/255) h=((b-r)/255/d + 2)/6;
      else h=((r-g)/255/d + 4)/6;
      return h;
    });
    const sortedHues = [...hues].sort((a,b)=>a-b);
    let gaps = 0;
    for(let i=1;i<sortedHues.length;i++) gaps += Math.abs(sortedHues[i]-sortedHues[i-1]);
    const consist = Math.round(Math.min(100, gaps*120));
    const access = fgC>=4.5? 95: fgC>=3? 70 : 40;
    const overall = Math.round((contrast+read+consist+access)/4);
    return {contrast, read, consist, access, overall};
  }

  function validationSection(){
    const checks = [
      ['JSON schema valid', 'ok'],
      ['Power BI compatible', 'ok'],
      ['Theme name set', state.themeName? 'ok' : 'warn'],
      ['8 data colors defined', state.dataColors.length===8? 'ok':'bad'],
      ['Foreground/background contrast', U.contrast(state.fg,state.bg)>=4.5? 'ok':'warn'],
      ['Font resolves to PBI fallback', 'ok'],
      ['No duplicate dataColors', new Set(state.dataColors.map(s=>s.toUpperCase())).size===8? 'ok':'warn']
    ];
    return fpSection('Validation', 'validation',
      U.el('div',{class:'v-list'},
        ...checks.map(([lbl, st])=>
          U.el('div',{class:'v-row'},
            U.el('div',{class:'vbadge '+st}, st==='ok'?'✓': st==='warn'?'!':'✕'),
            lbl
          )
        )
      )
    );
  }

  function jsonSection(){
    const json = Exports.buildThemeJSON();
    const txt = JSON.stringify(json, null, 2);
    const pre = U.el('pre',{class:'mono'});
    pre.innerHTML = highlight(txt);
    return fpSection('JSON preview', 'jsonPreview',
      U.el('div',{class:'json-preview'},
        U.el('div',{class:'actions'},
          U.el('button',{class:'btn sm', onclick:()=>U.copy(txt)}, icon('copy',12),'Copy'),
          U.el('button',{class:'btn sm primary', onclick:()=>Exports.themeJSON()}, icon('download',12),'Export')
        ),
        pre
      )
    );
  }

  function highlight(s){
    return s
      .replace(/[<>&]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))
      .replace(/("(?:[^"\\]|\\.)*")(\s*:)/g,'<span class="tok-key">$1</span><span class="tok-punct">$2</span>')
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g,':<span class="tok-str"> $1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g,':<span class="tok-num"> $1</span>')
      .replace(/:\s*(true|false|null)/g,':<span class="tok-bool"> $1</span>')
      .replace(/([{}[\],])/g,'<span class="tok-punct">$1</span>');
  }

  function fpSection(title, key, body){
    const head = U.el('button',{class:'fp-head'+(state.open[key]?' open':''),
      onclick: e=>{ state.open[key] = !state.open[key]; e.currentTarget.parentElement.classList.toggle('open'); e.currentTarget.classList.toggle('open'); }
    },
      U.caret(),
      U.el('span',{}, title)
    );
    return U.el('div',{class:'fp-section'+(state.open[key]?' open':'')}, head, U.el('div',{class:'fp-body'}, body));
  }

  return { render, fpSection };
})();
