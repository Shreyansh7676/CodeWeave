import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios';
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css"
import "codemirror/theme/ayu-dark.css"
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/edit/closetag";
import "codemirror/lib/codemirror.css";

import CodeMirror from "codemirror";
import useStore from '../store/store.jsx';

const TextEditor = ({ socketRef, id, initialCode, onCodeChange }) => {
  const { updateCode } = useStore();
  const [code, setCode] = useState(typeof initialCode === 'string' ? initialCode : "");
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
        updateCode(code);
        if (origin !== 'setValue') {
          socketRef.current.emit('code-change', {
            id,
            code,
          });
        }
      });
      if (initialCode && typeof initialCode === 'string') {
        editor.setValue(initialCode);
      }

    };

    init();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('code-change', ({ code }) => {
        if (code !== null && code !== undefined && typeof code === 'string' && code !== editorRef.current.getValue()) {
          editorRef.current.setValue(code);
        }
      });
    }
    return()=>{
      socketRef.current.off('code-change');  
    }

  }, [socketRef.current])

  useEffect(() => {
    if (editorRef.current && initialCode !== undefined && initialCode !== null && typeof initialCode === 'string') {
      if (editorRef.current.getValue() !== initialCode) {
        editorRef.current.setValue(initialCode);
      }
    }
  }, [initialCode]);
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

