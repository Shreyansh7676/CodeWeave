import React, { useEffect, useRef } from 'react'
import "codemirror/mode/javascript/javascript";
// import "codemirror/mode/python/python";
import "codemirror/theme/dracula.css"
import "codemirror/theme/ayu-dark.css"
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/closetag";
import "codemirror/lib/codemirror.css";

import CodeMirror from "codemirror";

const TextEditor = ({ socketRef, id, onCodeChange }) => {
  const editorRef = useRef(null);
  useEffect(() => {
    const init = async () => {
      const editor = CodeMirror.fromTextArea(
        document.getElementById("realtimeEditor"),
        {
          mode: { name: "javascript", json: true },
          theme: "ayu-dark",
          autoCloseTags: true,
          autoCloseBrackets: true,
          lineNumbers: true,
        }
      );
      // for sync the code
      editorRef.current = editor;

      editor.setSize(null, "100%");
      editorRef.current.on("change", (instance, changes) => {
        // console.log(`changes`,instance,changes);
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== 'setValue') {
          socketRef.current.emit('code-change', {
            id,
            code,
          });
        }
      });

    };

    init();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('code-change', ({ code }) => {
        if (code !== null) {
          editorRef.current.setValue(code);
        }
      });
    }
    return()=>{
      socketRef.current.off('code-change');  
    }

  }, [socketRef.current])


  return (
    <div style={{ height: "600px", width: "100%" }}>
      {/* 
        The textarea is only used as a mount point for CodeMirror.
        Do not use id, use ref instead. Do not try to edit this textarea directly.
      */}
      <textarea
        id='realtimeEditor'
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  )
}

export default TextEditor
